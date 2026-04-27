import React, { useMemo, useCallback } from "react";
import { TeamContext, type Player } from "./TeamContext";
import { useEditor } from "../Editor";

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    currentGroupId, 
    teamsPerRow, 
    teamSizeMode, 
    manualTeamMemberSize,
    allPlayers,           // 全域選手池 Record<string, string>
    backgroundFiles, 
    allGroupsPlayerMap,   // 存檔資料 Record<string, Record<number, string>>
    updateGroupPlayer,
    clearCurrentGroup,
    isGlobalPlayerFilter 
  } = useEditor();

  const benchPlayers = useMemo(() => {
    // 建立一個用於快速查詢的「已使用選手集合」
    const usedNames = new Set<string>();

    if (isGlobalPlayerFilter) {
      // --- 全域過濾模式：掃描所有組別的存檔 ---
      Object.values(allGroupsPlayerMap).forEach((groupMap) => {
        Object.values(groupMap).forEach((name) => {
          if (name) usedNames.add(name);
        });
      });
    } else {
      // --- 單組過濾模式：只掃描當前組別 ---
      const currentMap = allGroupsPlayerMap[currentGroupId] || {};
      Object.values(currentMap).forEach((name) => {
        if (name) usedNames.add(name);
      });
    }

    // 映射所有選手，並標記 isUsed
    return Object.entries(allPlayers).map(([name, url]) => ({
      id: name,
      name: name,
      url: url,
      // 只要名字在 usedNames 集合中，就標記為 true
      isUsed: usedNames.has(name),
    }));
  }, [allPlayers, allGroupsPlayerMap, currentGroupId, isGlobalPlayerFilter]);

  // 2. 取得當前背景圖片 (支援多種附檔名)
  const currentBackground = useMemo(() => {
    const key = Object.keys(backgroundFiles).find(
      p => p.split("/").pop()?.replace(/\.[^/.]+$/, "") === currentGroupId
    );
    return key ? backgroundFiles[key].default : "";
  }, [currentGroupId, backgroundFiles]);

  // 3. 【核心修正】計算總格數 (Slots)
  // 基於「全體選手人數」計算，確保切換背景時，格子佈局不會坍塌
  const totalSlots = useMemo(() => {
    if (teamSizeMode === "manual") {
      return manualTeamMemberSize * teamsPerRow;
    }

    // 自動模式：根據「全體選手池」的數量來預留格子
    const allPlayersCount = Object.keys(allPlayers).length || 1;
    const playersPerTeam = Math.ceil(allPlayersCount / teamsPerRow);
    
    // 確保至少有一排，且格數足以容納所有可用選手
    return teamsPerRow * (playersPerTeam || 1);
  }, [teamSizeMode, manualTeamMemberSize, teamsPerRow, allPlayers]);

  // 4. 建立陣容顯示清單 (對接 allPlayers 取得最新 URL)
  const lineupPlayers = useMemo(() => {
    // 取得當前背景對應的存檔物件 { index: "選手名" }
    const currentMap = allGroupsPlayerMap[currentGroupId] || {};
    
    return Array.from({ length: totalSlots }, (_, i) => {
      const playerName = currentMap[i];
      // 只有當存檔裡有名稱，且該名稱存在於全域選手池時才顯示
      if (playerName && allPlayers[playerName]) {
        return {
          id: playerName,
          name: playerName,
          url: allPlayers[playerName],
          isUsed: true,
        };
      }
      return null;
    });
  }, [allGroupsPlayerMap, currentGroupId, totalSlots, allPlayers]);

  // --- 交互邏輯 ---

  const addToLineup = useCallback((player: Player) => {
    const currentMap = allGroupsPlayerMap[currentGroupId] || {};
    if (Object.values(currentMap).includes(player.name)) return;

    for (let i = 0; i < totalSlots; i++) {
      if (!currentMap[i]) {
        updateGroupPlayer(i, player.name);
        break;
      }
    }
  }, [allGroupsPlayerMap, currentGroupId, totalSlots, updateGroupPlayer]);

  const movePlayer = useCallback((fromIndex: number, toIndex: number) => {
    const currentMap = allGroupsPlayerMap[currentGroupId] || {};
    const fromName = currentMap[fromIndex] || null;
    const toName = currentMap[toIndex] || null;

    updateGroupPlayer(toIndex, fromName);
    updateGroupPlayer(fromIndex, toName);
  }, [allGroupsPlayerMap, currentGroupId, updateGroupPlayer]);

  return (
    <TeamContext.Provider value={{
      benchPlayers,
      currentBackground,
      lineupPlayers,
      addToLineup,
      movePlayer,
      removeFromLineup: (i) => updateGroupPlayer(i, null),
      assignPlayerToSlot: (p, i) => updateGroupPlayer(i, p.name),
      clearTeam: clearCurrentGroup,
    }}>
      {children}
    </TeamContext.Provider>
  );
};