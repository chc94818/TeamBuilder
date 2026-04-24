import { useState } from "react";
import PlayerCell from "./PlayerCell";
import { useTeam, type Player } from "../context/Team";

function Bench() {
  const {
    benchPlayers,
    lineupPlayers,
    addToLineup,
    removeFromLineup,
    assignPlayerToSlot,
  } = useTeam();

  // 1. 新增狀態：記錄目前滑鼠經過哪一個板凳球員
  const [benchDragOverId, setBenchDragOverId] = useState<string | null>(null);
  const onBenchDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData("player", JSON.stringify(player));
    // 為了讓 Lineup 知道是從 Bench 來的，我們可以加個標記
    e.dataTransfer.setData("source", "bench");
    e.dataTransfer.effectAllowed = "move";
  };

  // 處理掉落在板凳球員身上的替換邏輯
  const onDropOnBenchItem = (e: React.DragEvent, targetPlayer: Player) => {
    e.preventDefault();
    e.stopPropagation();
    setBenchDragOverId(null); // 清除高亮

    const fromLineupIndex = e.dataTransfer.getData("fromLineupIndex");
    if (fromLineupIndex !== "") {
      const lineupIdx = parseInt(fromLineupIndex);
      const isTargetUsed = lineupPlayers.some((p) => p?.id === targetPlayer.id);

      if (!isTargetUsed) {
        assignPlayerToSlot(targetPlayer, lineupIdx);
      } else {
        removeFromLineup(lineupIdx);
      }
    }
  };

  return (
    <div
      className={`benchContainer`}
      onDrop={(e) => {
        e.preventDefault();
        const fromLineupIndex = e.dataTransfer.getData("fromLineupIndex");
        if (fromLineupIndex !== "") {
          removeFromLineup(parseInt(fromLineupIndex));
        }
      }}
    >
      <h3>Available Players ({benchPlayers.length})</h3>

      <div className="bench">
        {benchPlayers.map((player) => {
          const isUsed = lineupPlayers.some((p) => p?.id === player.id);
          const isCurrentTarget = benchDragOverId === player.id;

          return (
            <div
              key={player.id}
              className={`benchPlayerCellContainer ${isUsed ? "disabled" : ""} ${isCurrentTarget ? "drag-over" : ""}`}
              onClick={() => !isUsed && addToLineup(player)}
              draggable={!isUsed}
              onDragStart={(e) => onBenchDragStart(e, player)}
              onDragOver={(e) => {
                // 關鍵修正：檢查 dataTransfer 裡是否有來自 Lineup 的 Index
                // 注意：在 dragover 過程中，HTML5 為了安全不允許讀取 getData 的具體內容，
                // 但我們可以透過 types 來判斷是否存在該類型
                const isFromLineup =
                  e.dataTransfer.types.includes("fromlineupindex");

                if (!isUsed && isFromLineup) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  if (benchDragOverId !== player.id)
                    setBenchDragOverId(player.id);
                }
              }}
              onDragLeave={() => setBenchDragOverId(null)}
              onDrop={(e) => onDropOnBenchItem(e, player)}
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
