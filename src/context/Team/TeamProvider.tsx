import React, { useState } from "react";
import { TeamContext, type Player } from "./TeamContext";

// 搬移原本在 App.tsx 的圖片讀取邏輯
interface ImageModule {
  default: string;
}

const imageModules = import.meta.glob<ImageModule>(
  "../../assets/players/*.{png,jpg,jpeg,SVG}", // 注意路徑改為相對 Context 的位置
  { eager: true },
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

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1. 初始化隊伍資訊：長度與圖片總數一致，初始全部為 null
  const [lineupPlayers, setLineupPlayers] = useState<(Player | null)[]>(
    Array(allPlayers.length).fill(null),
  );

  // 交換或移動位置
  const movePlayer = (fromIndex: number, toIndex: number) => {
    setLineupPlayers((prev) => {
      const newArray = [...prev];
      const draggedItem = newArray[fromIndex];
      const targetItem = newArray[toIndex];

      // 如果是同一個位置，不動作
      if (fromIndex === toIndex) return prev;

      // 交換或移動
      newArray[toIndex] = draggedItem;
      newArray[fromIndex] = targetItem; // 如果 target 是 null，原本的位置就會變 null (移動效果)
      return newArray;
    });
  };

  const setPlayerAt = (player: Player, toIndex: number) => {
    setLineupPlayers((prev) => {
      // 檢查是否已在隊伍中 (除非是原本就在該位置)
      if (prev.some((p, i) => p?.id === player.id && i !== toIndex)) {
        // 如果已存在，則執行交換：找出舊位置，並跟目標位置互換
        const fromIndex = prev.findIndex((p) => p?.id === player.id);
        const newArray = [...prev];
        const targetPlayer = newArray[toIndex];
        newArray[toIndex] = player;
        newArray[fromIndex] = targetPlayer;
        return newArray;
      }

      const newArray = [...prev];
      newArray[toIndex] = player;
      return newArray;
    });
  };

  // 新增球員到第一個空位
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

  // 移除特定位置球員
  const removeFromLineup = (index: number) => {
    setLineupPlayers((prev) => {
      const newArray = [...prev];
      newArray[index] = null;
      return newArray;
    });
  };

  const assignPlayerToSlot = (player: Player, targetIndex: number) => {
    setLineupPlayers((prev) => {
      const newArray = [...prev];
      const existingIndex = newArray.findIndex((p) => p?.id === player.id);

      if (existingIndex !== -1) {
        // 情況 A：選手已經在陣容中（可能使用者硬是拖了灰階的選手，或是你想支援這種操作）
        // 我們就把他從舊位置「移動/交換」到新位置
        const targetItem = newArray[targetIndex];
        newArray[targetIndex] = player;
        newArray[existingIndex] = targetItem;
      } else {
        // 情況 B：全新的選手，直接覆蓋目標格子（原本有人的話會被擠掉）
        newArray[targetIndex] = player;
      }

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
        setPlayerAt,
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
