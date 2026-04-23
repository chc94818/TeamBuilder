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

// 定義暴露給父組件的介面
export interface LineupBoardHandle {
  exportLineupImage: (targetWidth: number) => Promise<string>; // 指定參數與回傳值為 Promise
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
    } = useEditor();
    const { lineupPlayers, removeFromLineup } = useTeam();
    const [contextMenu, setContextMenu] = useState<{
      x: number;
      y: number;
      index: number;
    } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null); // 新增：用於取得選單 DOM 的 Ref
    // 處理右鍵點擊事件
    const handleContextMenu = (e: React.MouseEvent, index: number) => {
      // 只有當該格子有選手時才觸發右鍵選單
      if (lineupPlayers[index]) {
        e.preventDefault(); // 阻斷瀏覽器預設選單
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          index: index,
        });
      }
    };

    // 點擊頁面其他地方時關閉選單
    useEffect(() => {
      const handleCloseMenu = () => setContextMenu(null);
      window.addEventListener("click", handleCloseMenu);
      return () => window.removeEventListener("click", handleCloseMenu);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const lineupContentRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    // 1. 本地像素狀態：這是 Rnd 渲染的唯一事實來源
    const [pixelLayout, setPixelLayout] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    // 當選單狀態改變時的副作用處理
    useEffect(() => {
      if (contextMenu) {
        // 1. 鎖定捲動：防止使用者在選單開啟時滾動背景
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";

        // 2. 自動聚焦：讓鍵盤操作或螢幕閱讀器能定位到選單
        // 使用 requestAnimationFrame 確保 DOM 已經渲染完成
        requestAnimationFrame(() => {
          menuRef.current?.focus();
        });

        // 清理函式：當選單關閉或組件卸載時，恢復捲動
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [contextMenu]);

    // 2. 同步邏輯：百分比 (Context) -> 像素 (Local)
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

    // 3. 初始化與視窗縮放監聽
    useEffect(() => {
      // 初次掛載時，稍微延遲確保容器寬高已渲染完成
      const timer = setTimeout(syncPixelsFromPercent, 100);
      window.addEventListener("resize", syncPixelsFromPercent);

      return () => {
        window.removeEventListener("resize", syncPixelsFromPercent);
        clearTimeout(timer);
      };
    }, [syncPixelsFromPercent]);

    // 4. 使用 rAF 更新全域面板數值 (像素 -> 百分比)
    const updatePanelValues = (x: number, y: number, w: number, h: number) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

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

    // 暴露方法給父組件
    useImperativeHandle(ref, () => ({
      exportLineupImage: async (targetWidth: number) => {
        if (!lineupContentRef.current) return null;

        const contentNode = lineupContentRef.current;

        // 1. 獲取當前容器在畫面上的實際像素寬度
        const currentWidth = contentNode.offsetWidth;

        // 2. 計算所需的縮放比例 (目標寬度 / 當前寬度)
        // 例如：目標 3840px / 目前 1280px = scale: 3
        const calculatedScale = targetWidth / currentWidth;

        const options = {
          scale: calculatedScale,
          backgroundColor: null,
          useCORS: true,
          logging: false,
          // 截圖前確保移除開發用的 Rnd 選取框樣式
          ignoreElements: (el: HTMLElement) =>
            el.classList.contains("rnd-dev-active"),
        };

        try {
          // 執行截圖
          const canvas = await html2canvas(contentNode, options);
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
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
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
            // 拖動中：更新本地像素並同步至面板 (透過 rAF)
            onDrag={(e, d) => {
              setPixelLayout((prev) => ({ ...prev, x: d.x, y: d.y }));
              updatePanelValues(
                d.x,
                d.y,
                pixelLayout.width,
                pixelLayout.height,
              );
            }}
            // 縮放中：更新本地像素並同步至面板 (透過 rAF)
            onResize={(e, dir, ref, delta, pos) => {
              const newW = ref.offsetWidth;
              const newH = ref.offsetHeight;
              setPixelLayout({ width: newW, height: newH, ...pos });
              updatePanelValues(pos.x, pos.y, newW, newH);
            }}
            // 停止時確保清除排程
            onDragStop={() => {
              if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            }}
            onResizeStop={() => {
              if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            }}
          >
            <div
              className="playerContainer"
              style={
                {
                  display: "grid",
                  gridTemplateColumns: `repeat(${teamsPerRow}, 1fr)`,
                  columnGap: `${columnGap}%`,
                  rowGap: `${rowGap}%`,
                  width: "100%",
                  "--cell-scale": `${playerCellSize / 100}`,
                } as React.CSSProperties
              }
            >
              {lineupPlayers.map((player, index) => (
                <div key={index} className="gridItem">
                  <div
                    style={{
                      transform: `scale(var(--cell-scale))`,
                      transformOrigin: "center",
                    }}
                    onContextMenu={(e) => handleContextMenu(e, index)} // 綁定右鍵事件
                  >
                    <PlayerCell player={player} />
                  </div>
                </div>
              ))}
            </div>
          </Rnd>
        </div>

        {/* 右鍵選單 UI */}
        {contextMenu && (
          <div
            className="lineupPopMenu"
            ref={menuRef} // 綁定 Ref
            tabIndex={-1} // 關鍵：讓 div 變得可以被 focus
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
          >
            <div
              className="removeButton"
              onClick={() => {
                removeFromLineup(contextMenu.index);
                setContextMenu(null); // 移除後主動關閉
              }}
            >
              Remove Player
            </div>
          </div>
        )}

        {/* Debug Panel: 顯示百分比與像素資訊 */}
        {/* {isLineupRndActive && (
        <div
          className="devDataPanel"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            zIndex: 9999,
            pointerEvents: "none",
            border: "1px solid #444"
          }}
        >
          <div style={{ color: "#00ff00", marginBottom: "5px" }}>[ Lineup Layout % ]</div>
          <div>X: {lineupLayout.x.toFixed(2)}% | Y: {lineupLayout.y.toFixed(2)}%</div>
          <div>W: {lineupLayout.w.toFixed(2)}% | H: {lineupLayout.h.toFixed(2)}%</div>
          
          <div style={{ color: "#00ccff", marginTop: "10px", marginBottom: "5px" }}>[ Grid Info ]</div>
          <div>PerRow: {teamsPerRow}</div>
          <div>Gap: C {columnGap.toFixed(2)}% / R {rowGap.toFixed(2)}%</div>
          <div>Cell: {playerCellSize.toFixed(2)}%</div>
        </div>
      )} */}
      </div>
    );
  },
);

export default Lineup;
