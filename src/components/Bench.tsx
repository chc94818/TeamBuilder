import { useState } from "react";
import PlayerCell from "./PlayerCell";
import { useTeam, type Player } from "../context/Team";

function Bench() {
  const { benchPlayers, lineupPlayers, addToLineup, removeFromLineup } = useTeam();
  // 用於控制拖曳經過時的視覺狀態
  const [isDragOver, setIsDragOver] = useState(false);

  const onBenchDragStart = (e: React.DragEvent, player: Player) => {
    // 將球員資料轉成字串塞進 dataTransfer
    e.dataTransfer.setData("player", JSON.stringify(player));
    // 設定滑鼠游標圖示為 "copy"
    e.dataTransfer.effectAllowed = "copy";
  };

  // 處理從 Lineup 拖回來的邏輯
  const onDropOnBench = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // 取得來自 Lineup 的 Index
    const fromLineupIndex = e.dataTransfer.getData("fromLineupIndex");

    if (fromLineupIndex !== "") {
      // 如果資料來源是 Lineup，就執行移除，選手就會在板凳區「恢復亮度」
      removeFromLineup(parseInt(fromLineupIndex));
      console.log("Player returned to bench");
    }
  };

  return (
    <div
      className={`benchContainer ${isDragOver ? "dragOver" : ""}`}
      onDragOver={(e) => {
        e.preventDefault(); // 必須 preventDefault 才能觸發 drop
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDropOnBench}
    >
      <h3>Available Players ({benchPlayers.length})</h3>

      <div className="bench">
        {benchPlayers.map((player) => {
          const isUsed = lineupPlayers.some((p) => p?.id === player.id);

          return (
            <div
              className={`benchPlayerCellContainer ${isUsed ? "disabled" : ""}`}
              key={player.id}
              onClick={() => !isUsed && addToLineup(player)}
              draggable={!isUsed}
              onDragStart={(e) => onBenchDragStart(e, player)}
            >
              <PlayerCell player={player} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Bench;