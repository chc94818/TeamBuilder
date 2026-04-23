import { createContext, useContext } from "react";

// 定義狀態的介面
interface EditorContextType {
  isLineupRndActive: boolean;
  toggleLineupRnd: () => void;
  playerCellSize: number; // 新增：選手尺寸 (px 或 %)
  setPlayerCellSize: (size: number) => void; // 新增：設定尺寸的函式
  teamsPerRow: number;
  setTeamsPerRow: (count: number) => void;
  columnGap: number;
  setColumnGap: (val: number) => void;
  rowGap: number;
  setRowGap: (val: number) => void;
  // editorContext.ts 介面新增
  lineupLayout: { x: number; y: number; w: number; h: number };
  setLineupLayout: (layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) => void;
  resetToDefault: () => void;
}

// 建立 Context 物件 (初始值設為 undefined)
export const EditorContext = createContext<EditorContextType | undefined>(
  undefined,
);

// 自定義 Hook：方便其他組件一鍵讀取
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor 必須在 EditorProvider 內使用");
  }
  return context;
};
