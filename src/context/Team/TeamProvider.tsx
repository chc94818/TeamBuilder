import React, { useState, useMemo } from "react";
import { TeamContext, type Player } from "./TeamContext";
import { useEditor } from "../Editor";

const allAssets = import.meta.glob(
  "../../assets/groups/**/*.{png,jpg,jpeg,svg,webp}",
  { eager: true },
);

type MultiGroupPlayerMap = Record<string, Record<number, Player>>;

interface AssetModule {
  default: string; // 假設它是圖片路徑或組件
  [key: string]: unknown; // 允許其他具名匯出
}

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentGroupId, teamsPerRow, teamSizeMode, manualTeamMemberSize } =
    useEditor();

  const [allGroupsPlayerMap, setAllGroupsPlayerMap] =
    useState<MultiGroupPlayerMap>({});

  const groupDataMap = useMemo(() => {
    const map: Record<string, { background: string; players: Player[] }> = {};

    (Object.entries(allAssets)as [string, AssetModule][]).forEach(([path, mod]: [string, AssetModule]) => {
      const parts = path.split("/");
      const groupName = parts[4];
      const subDir = parts[5];
      const fileName = parts[parts.length - 1].replace(/\.[^/.]+$/, "");

      if (!map[groupName]) {
        map[groupName] = { background: "", players: [] };
      }

      if (subDir === "background") {
        map[groupName].background = mod.default;
      } else if (subDir === "players") {
        map[groupName].players.push({
          id: `${groupName}_${fileName}`,
          name: fileName,
          url: mod.default,
        });
      }
    });
    return map;
  }, []);

  const currentGroupData = useMemo(() => {
    return groupDataMap[currentGroupId] || { background: "", players: [] };
  }, [currentGroupId, groupDataMap]);

  const currentPlayerMap = useMemo(() => {
    return allGroupsPlayerMap[currentGroupId] || {};
  }, [allGroupsPlayerMap, currentGroupId]);

  const totalSlots = useMemo(() => {
    if (teamSizeMode === "manual") {
      return manualTeamMemberSize * teamsPerRow;
    }

    const playersCount = currentGroupData.players.length || 1;
    const playersPerTeam = Math.ceil(playersCount / teamsPerRow);
    return teamsPerRow * playersPerTeam;
  }, [
    teamSizeMode,
    manualTeamMemberSize,
    currentGroupData.players,
    teamsPerRow,
  ]);

  const lineupPlayers = useMemo(() => {
    return Array.from(
      { length: totalSlots },
      (_, i) => currentPlayerMap[i] || null,
    );
  }, [currentPlayerMap, totalSlots]);

  const assignPlayerToSlot = (player: Player, targetIndex: number) => {
    setAllGroupsPlayerMap((prev) => {
      const newGroupMap = { ...(prev[currentGroupId] || {}) };

      // 移動/交換邏輯
      const oldIndex = Object.keys(newGroupMap).find(
        (key) => newGroupMap[parseInt(key)].id === player.id,
      );

      if (oldIndex !== undefined) {
        const oldIdxNum = parseInt(oldIndex);
        const targetPlayer = newGroupMap[targetIndex];
        if (targetPlayer) newGroupMap[oldIdxNum] = targetPlayer;
        else delete newGroupMap[oldIdxNum];
      }

      newGroupMap[targetIndex] = player;
      return { ...prev, [currentGroupId]: newGroupMap };
    });
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    setAllGroupsPlayerMap((prev) => {
      const newGroupMap = { ...(prev[currentGroupId] || {}) };
      const fromPlayer = newGroupMap[fromIndex];
      const toPlayer = newGroupMap[toIndex];

      if (fromPlayer) newGroupMap[toIndex] = fromPlayer;
      else delete newGroupMap[toIndex];

      if (toPlayer) newGroupMap[fromIndex] = toPlayer;
      else delete newGroupMap[fromIndex];

      return { ...prev, [currentGroupId]: newGroupMap };
    });
  };

  const addToLineup = (player: Player) => {
    if (Object.values(currentPlayerMap).some((p) => p.id === player.id)) return;

    for (let i = 0; i < totalSlots; i++) {
      if (!currentPlayerMap[i]) {
        assignPlayerToSlot(player, i);
        break;
      }
    }
  };

  const removeFromLineup = (index: number) => {
    setAllGroupsPlayerMap((prev) => {
      const newGroupMap = { ...(prev[currentGroupId] || {}) };
      delete newGroupMap[index];
      return { ...prev, [currentGroupId]: newGroupMap };
    });
  };

  const clearTeam = () => {
    setAllGroupsPlayerMap((prev) => ({
      ...prev,
      [currentGroupId]: {},
    }));
  };

  return (
    <TeamContext.Provider
      value={{
        benchPlayers: currentGroupData.players, // 這裡會隨組別切換
        currentBackground: currentGroupData.background, // 提供背景給 Lineup
        lineupPlayers,
        addToLineup,
        movePlayer,
        removeFromLineup,
        assignPlayerToSlot,
        clearTeam,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};
