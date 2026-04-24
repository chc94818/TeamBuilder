import React, { useState, useEffect } from "react";
import { EditorContext } from "./EditorContext";
import teamConfigData from "../../configs/team.json";

// 1. 定義 JSON 檔案的結構型別
interface TeamConfig {
  TeamNum: number;
  Layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  CellAspectRatio: number;
  CellSize: number;
  ColumnGap: number;
  RowGap: number;
}

// 強制轉型以獲得型別安全
const teamConfig = teamConfigData as TeamConfig;
const STORAGE_KEY = "editor_layout_cache";

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 2. 使用結構解構從 teamConfig 提取數值
  const { TeamNum, Layout, CellAspectRatio, CellSize, ColumnGap, RowGap } =
    teamConfig;
  const [isLineupRndActive, setIsLineupRndActive] = useState(false);

  // 嘗試從 localStorage 讀取暫存，如果沒有則使用 JSON 預設值
  const getInitialValue = (key: string, defaultValue: number | object) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const cache = JSON.parse(saved);
      return cache[key] !== undefined ? cache[key] : defaultValue;
    }
    return defaultValue;
  };

  const [teamsPerRow, setTeamsPerRow] = useState(
    getInitialValue("teamsPerRow", TeamNum),
  );
  const [playerCellAspectRatio, setPlayerCellAspectRatio] = useState(
    getInitialValue("playerCellAspectRatio", CellAspectRatio),
  );
  const [playerCellSize, _setPlayerCellSize] = useState(
    getInitialValue("playerCellSize", CellSize),
  );
  const [columnGap, setColumnGap] = useState(
    getInitialValue("columnGap", ColumnGap),
  );

  const [rowGap, setRowGap] = useState(getInitialValue("rowGap", RowGap));
  const [lineupLayout, setLineupLayout] = useState(
    getInitialValue("lineupLayout", {
      x: Layout.x,
      y: Layout.y,
      w: Layout.width,
      h: Layout.height,
    }),
  );

  // --- 功能 3: 暫存狀態 (useEffect) ---
  useEffect(() => {
    const configToCache = {
      teamsPerRow,
      playerCellAspectRatio,
      playerCellSize,
      columnGap,
      rowGap,
      lineupLayout,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToCache));
  }, [
    teamsPerRow,
    playerCellAspectRatio,
    playerCellSize,
    columnGap,
    rowGap,
    lineupLayout,
  ]);

  // --- 功能 1: 重置回預設值 ---
  const resetToDefault = () => {
    setTeamsPerRow(TeamNum);
    _setPlayerCellSize(CellSize);
    setColumnGap(ColumnGap);
    setRowGap(RowGap);
    setLineupLayout({
      x: Layout.x,
      y: Layout.y,
      w: Layout.width,
      h: Layout.height,
    });
    localStorage.removeItem(STORAGE_KEY); // 清除暫存
  };

  // 4. 封裝方法
  const setPlayerCellSize = (val: number) => {
    _setPlayerCellSize(Math.round(val * 100) / 100);
  };

  const toggleLineupRnd = () => setIsLineupRndActive((prev) => !prev);

  return (
    <EditorContext.Provider
      value={{
        isLineupRndActive,
        toggleLineupRnd,
        teamsPerRow,
        setTeamsPerRow,
        playerCellSize,
        setPlayerCellSize,
        columnGap,
        setColumnGap,
        rowGap,
        setRowGap,
        lineupLayout,
        setLineupLayout,
        resetToDefault,
        playerCellAspectRatio,
        setPlayerCellAspectRatio,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};
