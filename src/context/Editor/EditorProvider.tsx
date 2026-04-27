import React, { useState, useEffect, useRef } from "react";
import { EditorContext } from "./EditorContext";
import teamConfigData from "../../configs/team.json";

// 1. 定義型別結構
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
  TeamSizeMode: "auto" | "manual"; 
  GlobalPlayerFilter: boolean;
}

// 陣容存檔型別: { [背景ID]: { [格位索引]: "選手名稱" } }
type GroupPlayerMap = Record<string, Record<number, string>>;

const teamConfig = teamConfigData as TeamConfig;
const STORAGE_KEY = "editor_layout_cache";

// --- 資料掃描邏輯 ---

const backgroundFiles = import.meta.glob(
  "../../assets/background/**/*.{png,jpg,jpeg,svg,webp}",
  { eager: true },
) as Record<string, { default: string }>;

const playerFiles = import.meta.glob(
  "../../assets/players/**/*.{png,jpg,jpeg,svg,webp}",
  { eager: true },
) as Record<string, { default: string }>;

const autoDetectedGroups = Object.keys(backgroundFiles)
  .map((path) => {
    const fileName = path.split("/").pop();
    return fileName ? fileName.replace(/\.[^/.]+$/, "") : "";
  })
  .filter(Boolean)
  .sort();

const allPlayers = (() => {
  const players: Record<string, string> = {};
  Object.entries(playerFiles).forEach(([path, module]) => {
    const name = path
      .split("/")
      .pop()
      ?.replace(/\.[^/.]+$/, "");
    if (name) {
      players[name] = module.default;
    }
  });
  return players;
})();

// --- Provider 實作 ---

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isFirstRender = useRef(true);

  const getInitialValue = <T,>(key: string, def: T): T => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return def;
    try {
      const cache = JSON.parse(saved);
      return cache[key] !== undefined ? cache[key] : def;
    } catch {
      return def;
    }
  };

  // 狀態初始化
  const [isLineupRndActive, setIsLineupRndActive] = useState(false);
  const [isGlobalPlayerFilter, setIsGlobalPlayerFilter] = useState<boolean>(
    () => getInitialValue("isGlobalPlayerFilter", teamConfig.GlobalPlayerFilter),
  );
  
  const [currentGroupId, setCurrentGroupId] = useState(
    () => autoDetectedGroups[0] || "",
  );
  const [allGroupsPlayerMap, setAllGroupsPlayerMap] = useState<GroupPlayerMap>(
    () => getInitialValue("allGroupsPlayerMap", {}),
  );
  
  const [teamSizeMode, setTeamSizeMode] = useState<"auto" | "manual">(
    () => getInitialValue("teamSizeMode", teamConfig.TeamSizeMode),
  );

  // 用 Ref 永遠追蹤最新的 ID，避免閉包陷阱
  const currentGroupIdRef = useRef(currentGroupId);
  useEffect(() => {
    currentGroupIdRef.current = currentGroupId;
  }, [currentGroupId]);

  // 其他 UI 狀態
  const [teamsPerRow, setTeamsPerRow] = useState(() =>
    getInitialValue("teamsPerRow", teamConfig.TeamNum),
  );
  const [playerCellSize, _setPlayerCellSize] = useState(() =>
    getInitialValue("playerCellSize", teamConfig.CellSize),
  );
  const [columnGap, setColumnGap] = useState(() =>
    getInitialValue("columnGap", teamConfig.ColumnGap),
  );
  const [rowGap, setRowGap] = useState(() =>
    getInitialValue("rowGap", teamConfig.RowGap),
  );
  const [playerCellAspectRatio, setPlayerCellAspectRatio] = useState(() =>
    getInitialValue("playerCellAspectRatio", teamConfig.CellAspectRatio),
  );
  const [lineupLayout, setLineupLayout] = useState(() =>
    getInitialValue("lineupLayout", {
      x: teamConfig.Layout.x,
      y: teamConfig.Layout.y,
      w: teamConfig.Layout.width,
      h: teamConfig.Layout.height,
    }),
  );
  const [manualTeamMemberSize, setManualTeamMemberSize] = useState(4);

  // --- 【核心修正：帶有保護鎖的同步邏輯】 ---
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const configToCache = {
      teamsPerRow,
      playerCellAspectRatio,
      playerCellSize,
      columnGap,
      rowGap,
      lineupLayout,
      allGroupsPlayerMap, // 這裡儲存的是「所有背景」的聯集
      teamSizeMode,
      isGlobalPlayerFilter,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToCache));
  }, [
    teamsPerRow,
    playerCellAspectRatio,
    playerCellSize,
    columnGap,
    rowGap,
    lineupLayout,
    allGroupsPlayerMap,
    teamSizeMode,
    isGlobalPlayerFilter,
  ]);

  const updateGroupPlayer = (slotIndex: number, playerName: string | null) => {
    const activeId = currentGroupIdRef.current;
    if (!activeId) return;

    setAllGroupsPlayerMap((prev) => {
      const next = { ...prev };
      const groupData = { ...(next[activeId] || {}) };
      if (playerName === null) {
        delete groupData[slotIndex];
      } else {
        groupData[slotIndex] = playerName;
      }
      next[activeId] = groupData;
      return next;
    });
  };

  const clearCurrentGroup = () => {
    const activeId = currentGroupIdRef.current;
    if (!activeId) return;
    setAllGroupsPlayerMap((prev) => ({ ...prev, [activeId]: {} }));
  };

  const resetToDefault = () => {
    setTeamsPerRow(teamConfig.TeamNum);
    _setPlayerCellSize(teamConfig.CellSize);
    setColumnGap(teamConfig.ColumnGap);
    setRowGap(teamConfig.RowGap);
    setPlayerCellAspectRatio(teamConfig.CellAspectRatio);
    setLineupLayout({
      x: teamConfig.Layout.x,
      y: teamConfig.Layout.y,
      w: teamConfig.Layout.width,
      h: teamConfig.Layout.height,
    });
  };

  const toggleLineupRnd = () => setIsLineupRndActive((prev) => !prev);
  const toggleGlobalPlayerFilter = () => setIsGlobalPlayerFilter((prev) => !prev);

  return (
    <EditorContext.Provider
      value={{
        isLineupRndActive,
        toggleLineupRnd,
        isGlobalPlayerFilter,
        toggleGlobalPlayerFilter,
        teamsPerRow,
        setTeamsPerRow,
        playerCellSize,
        setPlayerCellSize: (v) => _setPlayerCellSize(Math.round(v * 100) / 100),
        columnGap,
        setColumnGap,
        rowGap,
        setRowGap,
        lineupLayout,
        setLineupLayout,
        resetToDefault,
        playerCellAspectRatio,
        setPlayerCellAspectRatio,
        currentGroupId,
        setCurrentGroupId,
        availableGroups: autoDetectedGroups,
        teamSizeMode,
        setTeamSizeMode,
        manualTeamMemberSize,
        setManualTeamMemberSize,
        allPlayers,
        backgroundFiles,
        allGroupsPlayerMap,
        updateGroupPlayer,
        clearCurrentGroup,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};
