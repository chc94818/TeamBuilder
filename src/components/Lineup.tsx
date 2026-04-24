import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Rnd } from "react-rnd";
import PlayerCell from "./PlayerCell";
import { useEditor } from "../context/Editor";
import { useTeam } from "../context/Team";
import html2canvas from "html2canvas";

export interface LineupBoardHandle {
  exportLineupImage: (targetWidth: number) => Promise<string | null>;
}

interface LineupProps {
  background: string;
}

const Lineup = forwardRef<LineupBoardHandle, LineupProps>(
  ({ background }: LineupProps, ref) => {
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
    const { lineupPlayers, movePlayer, removeFromLineup, assignPlayerToSlot } =
      useTeam();
    const [contextMenu, setContextMenu] = useState<{
      x: number;
      y: number;
      index: number;
    } | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lineupContentRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    const handleContextMenu = (e: React.MouseEvent, index: number) => {
      if (lineupPlayers[index]) {
        e.preventDefault();
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          index: index,
        });
      }
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
      const player = lineupPlayers[index];
      if (!player) return;

      setDraggedIndex(index);
      e.dataTransfer.setData("fromLineupIndex", index.toString());
      e.dataTransfer.setData("player", JSON.stringify(player));
      e.dataTransfer.effectAllowed = "move";

      // 視覺調整：僅在拖拽開始後微調透明度
      const target = e.target as HTMLElement;
      requestAnimationFrame(() => {
        target.style.opacity = "0.4";
      });
    };

    const onDragEnd = (e: React.DragEvent) => {
      // 1. 恢復透明度
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "1";
      }

      // 2. 新增：判斷是否拖曳到了「非法區域」
      // 如果 dropEffect 為 "none"，代表沒有被任何有效 Drop Target 接收
      if (e.dataTransfer.dropEffect === "none" && draggedIndex !== null) {
        console.log("Dropped in void, removing player...");
        removeFromLineup(draggedIndex);
      }

      // 3. 清理狀態
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    // ... 同時，為了讓這個行為更嚴謹，原本的 onDropOnBackground 也可以保留
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
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
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
      // 放置完成後立即清理
      setDragOverIndex(null);
      setDraggedIndex(null);
    };

    // 處理滑鼠離開容器時的殘留
    const handleContainerDragLeave = (e: React.DragEvent) => {
      // 只有滑鼠真正離開 playerContainer (而不是進入其中的 PlayerCell) 才重置
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverIndex(null);
      }
    };

    useEffect(() => {
      const handleCloseMenu = () => setContextMenu(null);
      window.addEventListener("click", handleCloseMenu);
      return () => window.removeEventListener("click", handleCloseMenu);
    }, []);

    const [pixelLayout, setPixelLayout] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    useEffect(() => {
      if (contextMenu) {
        document.body.style.overflow = "hidden";
        requestAnimationFrame(() => menuRef.current?.focus());
        return () => {
          document.body.style.overflow = "";
        };
      }
    }, [contextMenu]);

    const syncPixelsFromPercent = useCallback(() => {
      if (containerRef.current) {
        const { offsetWidth: cw, offsetHeight: ch } = containerRef.current;
        if (cw > 0 && ch > 0) {
          setPixelLayout({
            x: (lineupLayout.x / 100) * cw,
            y: (lineupLayout.y / 100) * ch,
            width: (lineupLayout.w / 100) * cw,
            height: (lineupLayout.h / 100) * ch,
          });
        }
      }
    }, [lineupLayout]);

    useEffect(() => {
      const timer = setTimeout(syncPixelsFromPercent, 100);
      window.addEventListener("resize", syncPixelsFromPercent);
      return () => {
        window.removeEventListener("resize", syncPixelsFromPercent);
        clearTimeout(timer);
      };
    }, [syncPixelsFromPercent]);

    const updatePanelValues = (x: number, y: number, w: number, h: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (containerRef.current) {
          const { offsetWidth: cw, offsetHeight: ch } = containerRef.current;
          if (cw > 0 && ch > 0) {
            setLineupLayout({
              x: Number(((x / cw) * 100).toFixed(2)),
              y: Number(((y / ch) * 100).toFixed(2)),
              w: Number(((w / cw) * 100).toFixed(2)),
              h: Number(((h / ch) * 100).toFixed(2)),
            });
          }
        }
        rafRef.current = null;
      });
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
          ignoreElements: (el: Element) =>
            el.classList.contains("rnd-dev-active"),
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
            <img src={background} className="background" alt="background" />
          </div>

          <Rnd
            className={isLineupRndActive ? "rnd-dev-active" : "rnd-dev-hidden"}
            size={{ width: pixelLayout.width, height: pixelLayout.height }}
            position={{ x: pixelLayout.x, y: pixelLayout.y }}
            disableDragging={!isLineupRndActive}
            enableResizing={isLineupRndActive}
            bounds="parent"
            onDrag={(e, d) => {
              setPixelLayout((prev) => ({ ...prev, x: d.x, y: d.y }));
              updatePanelValues(
                d.x,
                d.y,
                pixelLayout.width,
                pixelLayout.height,
              );
            }}
            onResize={(e, dir, ref, delta, pos) => {
              const newW = ref.offsetWidth;
              const newH = ref.offsetHeight;
              setPixelLayout({ width: newW, height: newH, ...pos });
              updatePanelValues(pos.x, pos.y, newW, newH);
            }}
            onDragStop={() => {
              if (rafRef.current) cancelAnimationFrame(rafRef.current);
            }}
            onResizeStop={() => {
              if (rafRef.current) cancelAnimationFrame(rafRef.current);
            }}
          >
            <div
              className="playerContainer"
              onDragLeave={handleContainerDragLeave}
              style={
                {
                  gridTemplateColumns: `repeat(${teamsPerRow}, 1fr)`,
                  columnGap: `${columnGap}%`,
                  rowGap: `${rowGap}%`,
                  "--cell-scale": `${playerCellSize / 100}`,
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
                    transform: `scale(var(--cell-scale))`,
                    aspectRatio: playerCellAspectRatio,
                    // 只有當 dragOver 且不是正在拖拽自己的那一格才顯示 outline
                    outline:
                      dragOverIndex === index ? "2px solid #fff" : "none",
                  }}
                >
                  <div
                    className="gridItem"
                    onContextMenu={(e) => handleContextMenu(e, index)}
                  >
                    <PlayerCell player={player} />
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
  },
);

export default Lineup;
