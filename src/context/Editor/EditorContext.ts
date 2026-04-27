import { createContext, useContext } from "react";

// 定義狀態的介面
interface EditorContextType {
  isLineupRndActive: boolean;
  toggleLineupRnd: () => void;
  isGlobalPlayerFilter: boolean;
  toggleGlobalPlayerFilter: () => void;
  playerCellSize: number;
  setPlayerCellSize: (size: number) => void;
  teamsPerRow: number;
  setTeamsPerRow: (count: number) => void;
  columnGap: number;
  setColumnGap: (val: number) => void;
  rowGap: number;
  setRowGap: (val: number) => void;

  lineupLayout: { x: number; y: number; w: number; h: number };
  setLineupLayout: (layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) => void;

  resetToDefault: () => void;
  playerCellAspectRatio: number;
  setPlayerCellAspectRatio: (val: number) => void;

  currentGroupId: string;
  setCurrentGroupId: (id: string) => void;
  availableGroups: string[];

  teamSizeMode: "auto" | "manual";
  setTeamSizeMode: (mode: "auto" | "manual") => void;
  manualTeamMemberSize: number;
  setManualTeamMemberSize: (size: number) => void;
  allPlayers: Record<string, string>;
  backgroundFiles: Record<string, { default: string }>;
  allGroupsPlayerMap: Record<string, Record<number, string>>;
  updateGroupPlayer: (slotIndex: number, playerName: string | null) => void;
  clearCurrentGroup: () => void; // 新增：清空當前陣容
}

export const EditorContext = createContext<EditorContextType | undefined>(
  undefined,
);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor 必須在 EditorProvider 內使用");
  }
  return context;
};
