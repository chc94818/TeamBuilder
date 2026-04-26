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
  const {
    lineupPlayers,
    movePlayer,
    removeFromLineup,
    assignPlayerToSlot,
    currentBackground,
  } = useTeam();
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
    requestAnimationFrame(() => {
      target.style.opacity = "0.4";
    });
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
        } catch (error) {
          console.error("Parse failed", error);
        }
      }
    }
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      setDragOverIndex(null);
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
      const contentNode = lineupContentRef.current as HTMLElement;

      // 1. 計算「真實解析度倍率」
      // 假設基礎寬度是 1920。如果你要輸出 3840，scale 就是 2。
      // 這樣 html2canvas 會用 2 倍的像素密度來畫，文字和 stroke 才會銳利。
      const baseWidth = 1920;
      const qualityScale = targetWidth / baseWidth;

      const options = {
        // 關鍵：這決定了導出圖片的「含金量」
        scale: qualityScale * (baseWidth / contentNode.offsetWidth),

        useCORS: true,
        backgroundColor: null,
        logging: false,
        // 不要在這裡設定 width/height 和 x/y，這最容易導致偏移
        scrollX: 0,
        scrollY: 0,
        windowWidth: baseWidth,
        windowHeight: (baseWidth * 1080) / 1920,
        ignoreElements: (el: Element) =>
          el.classList.contains("rnd-dev-active"),
      };

      try {
        // 此時 rawCanvas 的尺寸會剛好就是 targetWidth (例如 3840)
        const rawCanvas = await html2canvas(contentNode, options);

        // 2. 建立最終畫布，鎖死 16:9
        const finalCanvas = document.createElement("canvas");
        const targetHeight = Math.round((targetWidth * 1080) / 1920);
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;

        const ctx = finalCanvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // 3. 進行最後的精確裁切與填滿
          // 因為 DOM 可能有 13px 的誤差，我們只取 rawCanvas 頂部開始的 16:9 區域
          ctx.drawImage(
            rawCanvas,
            0,
            0,
            rawCanvas.width,
            (rawCanvas.width * 1080) / 1920, // 來源只取 16:9 區域
            0,
            0,
            targetWidth,
            targetHeight, // 填滿目標
          );

          return finalCanvas.toDataURL("image/png", 1.0);
        }
        return rawCanvas.toDataURL("image/png", 1.0);
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
          <img
            src={currentBackground}
            className="background"
            alt="background"
          />
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
            className="playerContainer playerCellBackgroundAnchor"
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
            {lineupPlayers.map((player, index) => {
              const rowIndex = Math.floor(index / teamsPerRow);
              const colIndex = index % teamsPerRow;
              return (
                <div
                  key={index}
                  className={`gridItemContainer row-${rowIndex} col-${colIndex} ${dragOverIndex === index ? "dragOver" : ""}`}
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
              );
            })}
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
