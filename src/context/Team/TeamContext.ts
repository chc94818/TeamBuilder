import { createContext, useContext } from "react";

// 定義球員資料型別
export interface Player {
  id: string; // 這裡我們用檔名當 ID
  name: string;
  url: string;
}

interface TeamContextType {
  benchPlayers: Player[]; // 所有的原始球員名單
  lineupPlayers: (Player | null)[]; // 當前陣容 (扁平陣列)
  addToLineup: (player: Player) => void;
  movePlayer: (fromIndex: number, toIndex: number) => void;
  removeFromLineup: (index: number) => void;
  assignPlayerToSlot: (player: Player, targetIndex: number) => void;
  clearTeam: () => void;
}

export const TeamContext = createContext<TeamContextType | undefined>(
  undefined,
);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error("useTeam must be used within a TeamProvider");
  return context;
};
