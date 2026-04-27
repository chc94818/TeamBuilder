import { useEditor } from "../context/Editor";
import { useTeam } from "../context/Team";

const RESOLUTIONS = {
  "1K": 1920,
  "2K": 2560,
  "4K": 3840,
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
    setRowGap,
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
    // clearTeam();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === "") return;

    let numValue = parseFloat(rawValue);
    // 像素模式下，限制可以放寬（例如最大 1000px）
    if (numValue > 1000) numValue = 1000;
    if (numValue < 0) numValue = 0;

    if (!isNaN(numValue)) {
      setPlayerCellSize(numValue);
    }
  };

  const handleLayoutChange = (key: string, value: string) => {
    let numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // 像素模式不再強制限制在 100 內，改為合理的大數值
      numValue = Math.max(0, numValue);
      setLineupLayout({ ...lineupLayout, [key]: numValue });
    }
  };

  const handleBlur = () => {
    setPlayerCellSize(Number(playerCellSize.toFixed(0))); // 像素通常取整數
  };

  const handleGapChange =
    (setter: (val: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
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
      TeamSizeMode: teamSizeMode,
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "team_config.json";
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
          
          {/* 拖曳模式 */}
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
                <span className="statusText">{isLineupRndActive ? "ON" : "OFF"}</span>
              </div>
            </div>
          </div>

          {/* 隊伍數量 */}
          <div className="editorOption TeamNumTool">
            <div className="editorControlItem">
              <span>每列隊伍數</span>
              <div className="inputGroup">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={teamsPerRow}
                  onChange={(e) => setTeamsPerRow(Math.max(1, parseInt(e.target.value) || 1))}
                  className="numberInput"
                />
                <span className="unit">隊</span>
              </div>
            </div>
          </div>

          {/* 人數設定 */}
          <div className="editorOption teamPlayersNumTool">
            <div className="editorControlItem">
              <div className="twoLineContainer">
                <div className="toolGroup">
                  <label>手動人數</label>
                  <div className="inputGroup">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isManual}
                        onChange={(e) => setTeamSizeMode(e.target.checked ? "manual" : "auto")}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
                <div className={`toolGroup ${isManual ? "" : "disabled"}`}>
                  <label>每隊人數</label>
                  <div className="inputGroup">
                    <input
                      type="number"
                      value={manualTeamMemberSize}
                      onChange={(e) => setManualTeamMemberSize(parseInt(e.target.value) || 0)}
                      className="numberInput"
                    />
                    <span className="unit">人</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 邊距 (x, y) */}
          <div className="editorOption editorControlGroup">
            <div className="editorControlItem">
              <span>左座標 (x)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  value={lineupLayout.x.toFixed(0)}
                  onChange={(e) => handleLayoutChange("x", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">px</span>
              </div>
            </div>
            <div className="editorControlItem">
              <span>上座標 (y)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  value={lineupLayout.y.toFixed(0)}
                  onChange={(e) => handleLayoutChange("y", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">px</span>
              </div>
            </div>
          </div>

          {/* 區域大小 (w, h) */}
          <div className="editorOption editorControlGroup">
            <div className="editorControlItem">
              <span>總寬度 (w)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  value={lineupLayout.w.toFixed(0)}
                  onChange={(e) => handleLayoutChange("w", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">px</span>
              </div>
            </div>
            <div className="editorControlItem">
              <span>總高度 (h)</span>
              <div className="inputGroup">
                <input
                  type="number"
                  value={lineupLayout.h.toFixed(0)}
                  onChange={(e) => handleLayoutChange("h", e.target.value)}
                  className="numberInput"
                />
                <span className="unit">px</span>
              </div>
            </div>
          </div>
        </section>

        <section className="centerPanel">
          <h3>選手卡片設定</h3>
          
          {/* 寬高比 - 保持數值，不標示 px/ % */}
          <div className="editorOption playerplayerCellAspectRatioTool">
            <div className="editorControlItem">
              <span>卡片寬高比</span>
              <div className="inputGroup">
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step={0.01}
                  value={playerCellAspectRatio}
                  onChange={(e) => setPlayerCellAspectRatio(parseFloat(e.target.value))}
                  className="numberSlider"
                />
                <input
                  step={0.01}
                  type="number"
                  value={playerCellAspectRatio}
                  onChange={(e) => setPlayerCellAspectRatio(parseFloat(e.target.value))}
                  className="numberInput"
                />
                <span className="unit">ratio</span>
              </div>
            </div>
          </div>

          {/* 卡片大小 */}
          <div className="editorOption playerCellSizeTool">
            <div className="editorControlItem">
              <span>卡片尺寸</span>
              <div className="inputGroup">
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="1"
                  value={playerCellSize}
                  onChange={handleChange}
                  className="numberSlider"
                />
                <input
                  type="number"
                  value={playerCellSize.toFixed(0)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="numberInput"
                />
                <span className="unit">px</span>
              </div>
            </div>
          </div>

          {/* 間距 */}
          <div className="editorOption GridGapTool">
            <div className="editorControlItem">
              <span>水平格子間距</span>
              <div className="inputGroup">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={columnGap}
                  onChange={handleGapChange(setColumnGap)}
                  className="numberSlider"
                />
                <input
                  type="number"
                  value={columnGap.toFixed(0)}
                  onChange={handleGapChange(setColumnGap)}
                  className="numberInput"
                />
                <span className="unit">px</span>
              </div>
            </div>
            <div className="editorControlItem">
              <span>垂直格子間距</span>
              <div className="inputGroup">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={rowGap}
                  onChange={handleGapChange(setRowGap)}
                  className="numberSlider"
                />
                <input
                  type="number"
                  value={rowGap.toFixed(0)}
                  onChange={handleGapChange(setRowGap)}
                  className="numberInput"
                />
                <span className="unit">px</span>
              </div>
            </div>
          </div>

          <h3>組別設定</h3>
          <div className="editorOption groupSelectTool">
            <div className="editorControlItem">
              <span>當前組別</span>
              <select
                value={currentGroupId}
                onChange={handleGroupChange}
                className="groupSelect"
              >
                {availableGroups.length > 0 ? (
                  availableGroups.map((group) => (
                    <option key={group} value={group}>
                      {group.replace(/_/g, " ")}
                    </option>
                  ))
                ) : (
                  <option disabled>未偵測到有效群組</option>
                )}
              </select>
            </div>
          </div>
        </section>

        <section className="rightPanel">
          <h3 className="exportButtonsTitle">輸出截圖</h3>
          <div className="editorOption downloadImage">
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
          
          <h3>介面操作</h3>
          <div className="editorOption stateActions">
            <div className="actionButtons">
              <button onClick={resetToDefault} className="resetButton">重置排版</button>
              <button onClick={downloadConfig} className="downloadButton">下載 JSON</button>
              <button onClick={clearTeam} className="clearLineupsButton">清空版面</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default EditorTool;