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
  const [currentGroupId, setCurrentGroupId] = useState(
    () => autoDetectedGroups[0] || "",
  );
  const [allGroupsPlayerMap, setAllGroupsPlayerMap] = useState<GroupPlayerMap>(
    () => getInitialValue("allGroupsPlayerMap", {}),
  );

  // 用 Ref 永遠追蹤最新的 ID，避免閉包陷阱
  const currentGroupIdRef = useRef(currentGroupId);
  useEffect(() => {
    currentGroupIdRef.current = currentGroupId;
  }, [currentGroupId]);

  // 其他 UI 狀態
  const [teamsPerRow, setTeamsPerRow] = useState(() =>
    getInitialValue("teamsPerRow", teamConfigData.TeamNum),
  );
  const [playerCellSize, _setPlayerCellSize] = useState(() =>
    getInitialValue("playerCellSize", teamConfigData.CellSize),
  );
  const [columnGap, setColumnGap] = useState(() =>
    getInitialValue("columnGap", teamConfigData.ColumnGap),
  );
  const [rowGap, setRowGap] = useState(() =>
    getInitialValue("rowGap", teamConfigData.RowGap),
  );
  const [playerCellAspectRatio, setPlayerCellAspectRatio] = useState(() =>
    getInitialValue("playerCellAspectRatio", teamConfigData.CellAspectRatio),
  );
  const [lineupLayout, setLineupLayout] = useState(() =>
    getInitialValue("lineupLayout", {
      x: teamConfigData.Layout.x,
      y: teamConfigData.Layout.y,
      w: teamConfigData.Layout.width,
      h: teamConfigData.Layout.height,
    }),
  );
  const [teamSizeMode, setTeamSizeMode] = useState<"auto" | "manual">("auto");
  const [manualTeamMemberSize, setManualTeamMemberSize] = useState(4);

  // --- 【核心修正：帶有保護鎖的同步邏輯】 ---
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 保護鎖：如果發現 allGroupsPlayerMap 是空的，且 LocalStorage 裡其實是有資料的
    // 這表示目前處於狀態切換的混亂期，絕對不要寫入，否則會洗掉存檔
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    if (Object.keys(allGroupsPlayerMap).length === 0 && savedRaw) {
      const savedData = JSON.parse(savedRaw);
      if (
        savedData.allGroupsPlayerMap &&
        Object.keys(savedData.allGroupsPlayerMap).length > 0
      ) {
        console.warn("偵測到異常清空企圖，已攔截存檔動作");
        return;
      }
    }

    const configToCache = {
      teamsPerRow,
      playerCellAspectRatio,
      playerCellSize,
      columnGap,
      rowGap,
      lineupLayout,
      allGroupsPlayerMap, // 這裡儲存的是「所有背景」的聯集
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
    setTeamsPerRow(teamConfigData.TeamNum);
    _setPlayerCellSize(teamConfigData.CellSize);
    setColumnGap(teamConfigData.ColumnGap);
    setRowGap(teamConfigData.RowGap);
    setPlayerCellAspectRatio(teamConfigData.CellAspectRatio);
    setLineupLayout({
      x: teamConfigData.Layout.x,
      y: teamConfigData.Layout.y,
      w: teamConfigData.Layout.width,
      h: teamConfigData.Layout.height,
    });
  };

  return (
    <EditorContext.Provider
      value={{
        isLineupRndActive: false,
        toggleLineupRnd: () => {},
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
