import React, { useState, useMemo } from "react";
import { TeamContext, type Player } from "./TeamContext";
import { useEditor } from "../Editor";

// 載入球員圖片 (保持原本邏輯)
const imageModules = import.meta.glob<{ default: string }>(
  "../../assets/players/*.{png,jpg,jpeg,SVG}",
  { eager: true }
);

const allPlayers: Player[] = Object.entries(imageModules).map(([path, mod]) => {
  const fileName = path.split("/").pop()?.replace(/\.[^/.]+$/, "") || "";
  return { id: fileName, name: fileName, url: mod.default };
});

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { teamsPerRow } = useEditor();

  // 1. 核心狀態：使用 Map 存儲 { index: Player }
  // 這樣不論網格如何變動，資料結構都不會因為陣列長度改變而位移
  const [playerMap, setPlayerMap] = useState<Record<number, Player>>({});

  // 2. 派生狀態 (Derived State)：計算總格數
  // 24人 7隊的邏輯：確保是 teamsPerRow 的倍數
  const totalSlots = useMemo(() => {
    const playersPerTeam = Math.ceil(allPlayers.length / teamsPerRow);
    return teamsPerRow * playersPerTeam;
  }, [teamsPerRow]);

  // 3. 組合渲染用的陣列：這是給 Lineup 組件 map 用的
  // 當 teamsPerRow 改變，這裡會直接產生新陣列，不觸發額外的 useEffect
  const lineupPlayers = useMemo(() => {
    return Array.from({ length: totalSlots }, (_, i) => playerMap[i] || null);
  }, [playerMap, totalSlots]);

  // --- 操作方法 ---

  const assignPlayerToSlot = (player: Player, targetIndex: number) => {
    setPlayerMap((prev) => {
      const newMap = { ...prev };
      // 找出該球員是否已在陣容中，若有則移除舊位置 (實現移動/交換)
      const oldIndex = Object.keys(newMap).find(key => newMap[parseInt(key)].id === player.id);
      
      if (oldIndex !== undefined) {
        const oldIdxNum = parseInt(oldIndex);
        const targetPlayer = newMap[targetIndex];
        if (targetPlayer) {
          newMap[oldIdxNum] = targetPlayer; // 交換
        } else {
          delete newMap[oldIdxNum]; // 單純移動
        }
      }
      
      newMap[targetIndex] = player;
      return newMap;
    });
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    setPlayerMap((prev) => {
      const newMap = { ...prev };
      const fromPlayer = newMap[fromIndex];
      const toPlayer = newMap[toIndex];

      if (fromPlayer) newMap[toIndex] = fromPlayer;
      else delete newMap[toIndex];

      if (toPlayer) newMap[fromIndex] = toPlayer;
      else delete newMap[fromIndex];

      return newMap;
    });
  };

  const addToLineup = (player: Player) => {
    // 檢查是否已存在
    if (Object.values(playerMap).some(p => p.id === player.id)) return;
    
    // 找到第一個空位 (null)
    for (let i = 0; i < totalSlots; i++) {
      if (!playerMap[i]) {
        setPlayerMap(prev => ({ ...prev, [i]: player }));
        break;
      }
    }
  };

  const removeFromLineup = (index: number) => {
    setPlayerMap((prev) => {
      const newMap = { ...prev };
      delete newMap[index];
      return newMap;
    });
  };

  const clearTeam = () => setPlayerMap({});

  return (
    <TeamContext.Provider
      value={{
        benchPlayers: allPlayers,
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