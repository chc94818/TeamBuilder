import React, { useState } from "react";
import { TeamContext, type Player } from "./TeamContext";

// 搬移原本在 App.tsx 的圖片讀取邏輯
interface ImageModule {
  default: string;
}

const imageModules = import.meta.glob<ImageModule>(
  "../../assets/players/*.{png,jpg,jpeg,SVG}", // 注意路徑改為相對 Context 的位置
  { eager: true }
);

const allPlayers: Player[] = Object.entries(imageModules).map(([path, mod]) => {
  const fileNameWithExt = path.split("/").pop() || "";
  const fileName = fileNameWithExt.replace(/\.[^/.]+$/, "");
  return {
    id: fileName, // 使用檔名作為唯一 ID
    name: fileName,
    url: mod.default,
  };
});

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. 初始化隊伍資訊：長度與圖片總數一致，初始全部為 null
  const [lineupPlayers, setLineupPlayers] = useState<(Player | null)[]>(
    Array(allPlayers.length).fill(null)
  );

  // 2. 新增球員到第一個空位
  const addToLineup = (player: Player) => {
    setLineupPlayers((prev) => {
      // 檢查是否已在隊伍中 (避免重複使用)
      if (prev.some((p) => p?.id === player.id)) return prev;

      const firstEmptyIndex = prev.indexOf(null);
      if (firstEmptyIndex !== -1) {
        const newArray = [...prev];
        newArray[firstEmptyIndex] = player;
        return newArray;
      }
      return prev; // 滿了就不動作
    });
  };

  // 3. 移除特定位置球員
  const removeFromLineup = (index: number) => {
    setLineupPlayers((prev) => {
      const newArray = [...prev];
      newArray[index] = null;
      return newArray;
    });
  };

  const clearTeam = () => {
    setLineupPlayers(Array(allPlayers.length).fill(null));
  };

  return (
    <TeamContext.Provider 
      value={{ 
        benchPlayers: allPlayers, 
        lineupPlayers, 
        addToLineup, 
        removeFromLineup, 
        clearTeam 
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};
