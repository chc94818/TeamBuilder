import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Rnd } from "react-rnd";
import PlayerCellV2 from "./PlayerCellV2";
import { useEditor } from "../context/Editor";
import { useTeam } from "../context/Team";
import html2canvas from "html2canvas";

export interface LineupBoardHandle {
  exportLineupImage: (targetWidth: number) => Promise<string | null>;
}

const Lineup = forwardRef<LineupBoardHandle, object>((_props, ref) => {
  const {
    isLineupRndActive,
    teamsPerRow,
    playerCellSize,
    columnGap,
    rowGap,
    lineupLayout,
    setLineupLayout,
    playerCellAspectRatio,
  } = useEditor();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { lineupPlayers, movePlayer, removeFromLineup, assignPlayerToSlot, currentBackground } =
    useTeam();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    index: number;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineupContentRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------------------
  // 拖拽與右鍵邏輯 (保持不變)
  // ----------------------------------------------------------------

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    if (lineupPlayers[index]) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, index });
    }
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    const player = lineupPlayers[index];
    if (!player) return;
    setDraggedIndex(index);
    e.dataTransfer.setData("fromLineupIndex", index.toString());
    e.dataTransfer.setData("player", JSON.stringify(player));
    e.dataTransfer.effectAllowed = "move";
    const target = e.target as HTMLElement;
    requestAnimationFrame(() => { target.style.opacity = "0.4"; });
  };

  const onDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) e.target.style.opacity = "1";
    if (e.dataTransfer.dropEffect === "none" && draggedIndex !== null) {
      removeFromLineup(draggedIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onDropOnBackground = (e: React.DragEvent) => {
    const fromLineupIndex = e.dataTransfer.getData("fromLineupIndex");
    if (fromLineupIndex !== "") {
      removeFromLineup(parseInt(fromLineupIndex));
    }
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const onDropOnGrid = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null) {
      movePlayer(draggedIndex, toIndex);
    } else {
      const benchPlayerData = e.dataTransfer.getData("player");
      if (benchPlayerData) {
        try {
          const player = JSON.parse(benchPlayerData);
          assignPlayerToSlot(player, toIndex);
        } catch (error) { console.error("Parse failed", error); }
      }
    }
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIndex(null);
  };

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  // ----------------------------------------------------------------
  // 核心改動：直接同步像素數據
  // ----------------------------------------------------------------

  // 當 Rnd 停止拖拽或縮放時，直接將像素值存入 Context
  const updateLayoutPixels = (x: number, y: number, w: number, h: number) => {
    setLineupLayout({ x, y, w, h });
  };

  useImperativeHandle(ref, () => ({
    exportLineupImage: async (targetWidth: number) => {
      if (!lineupContentRef.current) return null;
      const contentNode = lineupContentRef.current;
      const currentWidth = contentNode.offsetWidth;
      const calculatedScale = targetWidth / currentWidth;

      const options = {
        scale: calculatedScale,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        ignoreElements: (el: Element) => el.classList.contains("rnd-dev-active"),
      };

      try {
        const canvas = await html2canvas(contentNode as HTMLElement, options);
        return canvas.toDataURL("image/png", 1.0);
      } catch (error) {
        console.error("Export failed:", error);
        return null;
      }
    },
  }));

  return (
    <div
      className="lineupContainer"
      ref={containerRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropOnBackground}
    >
      <div className="lineupContent" ref={lineupContentRef}>
        <div className="backgroundLayer">
          <img src={currentBackground} className="background" alt="background" />
        </div>

        <Rnd
          className={isLineupRndActive ? "rnd-dev-active" : "rnd-dev-hidden"}
          // 直接使用 lineupLayout 的像素值
          size={{ width: lineupLayout.w, height: lineupLayout.h }}
          position={{ x: lineupLayout.x, y: lineupLayout.y }}
          disableDragging={!isLineupRndActive}
          enableResizing={isLineupRndActive}
          bounds="parent"
          onDragStop={(e, d) => {
            updateLayoutPixels(d.x, d.y, lineupLayout.w, lineupLayout.h);
          }}
          onResizeStop={(e, dir, ref, delta, pos) => {
            updateLayoutPixels(pos.x, pos.y, ref.offsetWidth, ref.offsetHeight);
          }}
        >
          <div
            className="playerContainer"
            onDragLeave={handleContainerDragLeave}
            style={
              {
                display: "grid",
                gridTemplateColumns: `repeat(${teamsPerRow}, 1fr)`,
                // 改為像素單位 (px)
                columnGap: `${columnGap}px`,
                rowGap: `${rowGap}px`,
                // 卡片縮放現在基於原始像素大小的比例，或者直接鎖定
                // "--cell-scale": `${playerCellSize / 100}`, 
                // "--card-width": `${playerCellSize}`,
              } as React.CSSProperties
            }
          >
            {lineupPlayers.map((player, index) => (
              <div
                key={index}
                className={`gridItemContainer ${dragOverIndex === index ? "drag-over" : ""}`}
                draggable={!!player}
                onDragStart={(e) => onDragStart(e, index)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDropOnGrid(e, index)}
                style={{
                  // 如果 playerCellSize 現在是像素值(如 120px)，這裡要相應調整
                  // 假設你的邏輯是 transform: scale，則維持比例計算
                  // transform: `scale(${playerCellSize / 100})`,
                  width: playerCellSize,
                  aspectRatio: playerCellAspectRatio,
                }}
              >
                <div
                  className="gridItem"
                  onContextMenu={(e) => handleContextMenu(e, index)}
                >
                  <PlayerCellV2 player={player} />
                </div>
              </div>
            ))}
          </div>
        </Rnd>
      </div>

      {contextMenu && (
        <div
          className="lineupPopMenu"
          ref={menuRef}
          tabIndex={-1}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div
            className="removeButton"
            onClick={() => {
              removeFromLineup(contextMenu.index);
              setContextMenu(null);
            }}
          >
            Remove Player
          </div>
        </div>
      )}
    </div>
  );
});

export default Lineup;