import { useEditor } from "../context/Editor";
import { useTeam } from "../context/Team";
const RESOLUTIONS = {
  "1K": 1920,
  "2K": 2560,
  "4K": 3840,
  // "8K": 7680
};

function EditorTool({ onExport }: { onExport: (scale: number) => void }) {
  const {
    isLineupRndActive,
    toggleLineupRnd,
    playerCellSize,
    setPlayerCellSize,
    teamsPerRow,
    setTeamsPerRow,
    columnGap,
    setColumnGap,
    rowGap,
    // setRowGap,
    lineupLayout,
    setLineupLayout,
    resetToDefault,
    playerCellAspectRatio,
    setPlayerCellAspectRatio,
    setCurrentGroupId,
    availableGroups,
    currentGroupId,
    teamSizeMode,
    setTeamSizeMode,
    manualTeamMemberSize,
    setManualTeamMemberSize,
  } = useEditor();
  const { clearTeam } = useTeam();

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroupId = e.target.value;
    setCurrentGroupId(newGroupId);
    clearTeam(); // 確保切換時舊組別的球員不會留在畫面上
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // 如果是空的，先不處理（允許使用者刪除文字）
    if (rawValue === "") return;

    let numValue = parseFloat(rawValue);

    // 限制範圍 0 ~ 150
    if (numValue > 150) numValue = 150;
    if (numValue < 0) numValue = 0;

    if (!isNaN(numValue)) {
      setPlayerCellSize(numValue);
    }
  };

  const handleLayoutChange = (key: string, value: string) => {
    let numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // 限制在 0-100 之間
      numValue = Math.min(100, Math.max(0, numValue));
      setLineupLayout({ ...lineupLayout, [key]: numValue });
    }
  };

  // 當失去焦點 (Blur) 時，強制執行一次狀態同步，確保數值結構正確
  const handleBlur = () => {
    setPlayerCellSize(Number(playerCellSize.toFixed(1)));
  };

  const handleGapChange =
    (setter: (val: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0 && val <= 20) {
        // 間距通常不會超過 20%
        setter(val);
      }
    };

  const downloadConfig = () => {
    const output = {
      TeamNum: teamsPerRow,
      Layout: {
        x: lineupLayout.x,
        y: lineupLayout.y,
        width: lineupLayout.w,
        height: lineupLayout.h,
      },
      CellSize: playerCellSize,
      CellAspectRatio: playerCellAspectRatio,
      ColumnGap: columnGap,
      RowGap: rowGap,
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "team.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const isManual = teamSizeMode === "manual";

  return (
    <div className="editorToolContainer">
      <h2>Editor Tool</h2>
      <div className="toolPanel">
        <section className="leftPanel">
          <h3>排版設定</h3>
          <div className="editorOption lineupRndTool">
            <div className="editorControlItem">
              <span className="labelText">拖曳編輯模式</span>
              <div className="inputGroup">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isLineupRndActive}
                    onChange={toggleLineupRnd}
                  />
                  <span className="slider round"></span>
                </label>
                <span className="statusText">
                  {isLineupRndActive ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>
          <div className="editorOption TeamNumTool">
            <div className="editorControlItem">
              <span>隊伍數量</span>
              <div className="inputGroup">
                <input
                  id="teamNumInput"
                  type="number"
                  min="1"
                  max="8"
                  value={teamsPerRow}
                  onChange={(e) =>
                    setTeamsPerRow(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="numberInput"
                />
                <span className="unit">隊</span>
              </div>
            </div>
          </div>
          <div className="editorOption teamPlayersNumTool">
            <div className="editorControlItem">
              <div className="twoLineContainer">
                <div className="toolGroup">
                  <label>手動設定人數</label>
                  <div className="inputGroup">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isManual}
                        onChange={(e) =>
                          setTeamSizeMode(e.target.checked ? "manual" : "auto")
                        }
                      />
                      <span className="slider round"></span>
                    </label>
                    <span className="statusText">
                      {isManual ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
                <div className={`toolGroup ${isManual ? "": "disabled"}`}>
                  <label>設置隊伍人數</label>
                  <div className="inputGroup">
                    <input
                      type="number"
                      value={manualTeamMemberSize}
                      onChange={(e) =>
                        setManualTeamMemberSize(parseInt(e.target.value) || 0)
                      }
                      className="numberInput"
                    />
                    <span className="unit">人/隊</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="editorOption editorControlGroup">
            <div className="editorControlItem">
              <span>左邊距 (x)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  step="0.1"
                  value={lineupLayout.x.toFixed(1)}
                  onChange={(e) => handleLayoutChange("x", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </div>
            </div>
            <div className="editorControlItem">
              <span>上邊距 (y)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  step="0.1"
                  value={lineupLayout.y.toFixed(1)}
                  onChange={(e) => handleLayoutChange("y", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </div>
            </div>
          </div>

          {/* RND 尺寸控制 (w, h) */}
          <div className="editorOption editorControlGroup">
            <div className="editorControlItem">
              <span>寬度 (w)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  step="0.1"
                  value={lineupLayout.w.toFixed(1)}
                  onChange={(e) => handleLayoutChange("w", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </div>
            </div>
            <div className="editorControlItem">
              <span>高度 (h)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  step="0.1"
                  value={lineupLayout.h.toFixed(1)}
                  onChange={(e) => handleLayoutChange("h", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </div>
            </div>
          </div>
        </section>
        <section className="centerPanel">
          <h3>選手卡片設定</h3>
          <div className="editorOption playerplayerCellAspectRatioTool">
            <div className="editorControlItem">
              <span>選手卡片寬高比</span>
              <div className="inputGroup">
                <input
                  id="playerplayerCellAspectRatioSlider"
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={playerCellAspectRatio.toFixed(1)}
                  onChange={(e) =>
                    setPlayerCellAspectRatio(parseFloat(e.target.value))
                  }
                  className="numberSlider"
                />
                {/* 數字輸入框：鍵盤精確輸入 */}
                <input
                  id="playerplayerCellAspectRatioInput"
                  type="number"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={playerCellAspectRatio.toFixed(1)}
                  onChange={(e) =>
                    setPlayerCellAspectRatio(parseFloat(e.target.value))
                  }
                  onBlur={handleBlur}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </div>
            </div>
          </div>
          <div className="editorOption playerCellSizeTool">
            <div className="editorControlItem">
              <span>選手卡片大小</span>
              <div className="inputGroup">
                <input
                  id="playerCellSizeSlider"
                  type="range"
                  min="50"
                  max="150"
                  step="0.1"
                  value={playerCellSize.toFixed(1)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="numberSlider"
                />

                {/* 數字輸入框：鍵盤精確輸入 */}
                <input
                  id="playerCellSizeInput"
                  type="number"
                  min="50"
                  max="150"
                  step="0.1"
                  value={playerCellSize.toFixed(1)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </div>
            </div>
          </div>

          <div className="editorOption GridGapTool">
            {/* Column Gap 調整 */}
            <div className="editorControlItem">
              <span>水平間距</span>
              <div className="inputGroup">
                <input
                  id="gridColumeGapSlider"
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={columnGap}
                  onChange={handleGapChange(setColumnGap)}
                  className="numberSlider"
                />
                <input
                  id="gridColumeGapInput"
                  type="number"
                  step="0.1"
                  value={columnGap.toFixed(1)}
                  onChange={handleGapChange(setColumnGap)}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </div>
            </div>
          </div>

          <h3>組別設定</h3>
          <div className="editorOption groupSelectTool">
            <div className="editorControlItem">
              <span>當前組別</span>
              <select
                id="groupSelect"
                value={currentGroupId}
                onChange={handleGroupChange}
                className="groupSelect"
              >
                {availableGroups.length > 0 ? (
                  availableGroups.map((group) => (
                    <option key={group} value={group}>
                      {group.replace(/_/g, " ")} {/* 將底線換成空格比較美觀 */}
                    </option>
                  ))
                ) : (
                  <option disabled>未偵測到有效群組</option>
                )}
              </select>
            </div>
          </div>

          {/* <div className="editorOption GridGapTool">
            <div className="editorControlItem">
              <span>垂直間距</span>
              <span className="inputGroup">
                <input
                  id="gridRowGapSlider"
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={rowGap}
                  onChange={handleGapChange(setRowGap)}
                />
                <input
                  id="gridRowGapInput"
                  type="number"
                  step="0.1"
                  value={rowGap.toFixed(1)}
                  onChange={handleGapChange(setRowGap)}
                  className="numberInput"
                />
                <span className="unit">%</span>
              </span>
            </div>
          </div> */}
        </section>
        <section className="rightPanel">
          <h3 className="exportButtonsTitle">輸出截圖</h3>
          <div className="editorOption downloadImage">
            <div className="editorControlItem">
              <div className="actionButtons">
                {Object.entries(RESOLUTIONS).map(([label, width]) => (
                  <button
                    key={label}
                    onClick={() => onExport(width)}
                    className={`exportButton button${label}`}
                  >
                    Export {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <h3>介面操作</h3>
          <div className="editorOption stateActions">
            <div className="editorControlItem">
              <div className="actionButtons">
                {/* 重置按鈕 */}
                <button onClick={resetToDefault} className="resetButton">
                  重置排版
                </button>
                {/* 下載按鈕 */}
                <button onClick={downloadConfig} className="downloadButton">
                  下載排版設定檔
                </button>
                <button onClick={clearTeam} className="clearLineupsButton">
                  重置隊伍版面
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default EditorTool;
