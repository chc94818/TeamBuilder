import { useLayoutEffect, useRef, useState } from "react";
import { StrokeText } from "./StrokeText";

interface PlayerProps {
  player: {
    name: string;
    url: string;
  } | null;
}

const NAME_LENGTH_MAP = {
  SHORT: 4,
  MEDIUM: 10,
  LONG: 14,
};

function PlayerCell({ player }: PlayerProps) {
  const cellContainerRef = useRef<HTMLDivElement>(null);

  // 當視窗縮放或組件掛載時，計算與父容器的相對位置
  useLayoutEffect(() => {
    const updatePosition = () => {
      if (!cellContainerRef.current) return;

      // 找到共同的父容器 (例如 grid container)
      // 假設父容器的 class 是 .player-grid-container
      const parent = cellContainerRef.current.closest(".playerContainer");
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const cellRect = cellContainerRef.current.getBoundingClientRect();

      // 計算偏移量
      const offsetX = parentRect.left - cellRect.left;
      const offsetY = parentRect.top - cellRect.top;

      // 將變數注入 style
      cellContainerRef.current.style.setProperty("--offset-x", `${offsetX}px`);
      cellContainerRef.current.style.setProperty("--offset-y", `${offsetY}px`);
      cellContainerRef.current.style.setProperty("--parent-w", `${parentRect.width}px`);
      cellContainerRef.current.style.setProperty("--parent-h", `${parentRect.height}px`);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [player]); // 當玩家資料變更時重新計算

  if (!player) {
    return <div className="playerCell empty"></div>;
  }

  const { name, url } = player;

  const getNameClass = (name: string): string => {
    const parts = name.split(/(?=[&(\(]|吃吃吃|茶泡飯|翟普瑞薩)/g);
    const maxLineLength = Math.max(...parts.map((part) => part.length));
    if (maxLineLength <= NAME_LENGTH_MAP["SHORT"]) return "large";
    if (maxLineLength <= NAME_LENGTH_MAP["MEDIUM"]) return "medium";
    if (maxLineLength <= NAME_LENGTH_MAP["LONG"]) return "small";
    return "medium"; 
  };

  const renderName = (name: string) => {
    const parts = name.split(/(?=[&(\(]|吃吃吃|茶泡飯|翟普瑞薩)/g);
    return parts.map((part, index) => (
      <StrokeText key={index} text={part} />
    ));
  };

  const nameLengthClass = getNameClass(name);

  return (
     <div className="playerCellContainer" ref={cellContainerRef}>
      <div className="playerCellV2">
        <div className="playerImg">
          <img src={url} alt={name} />
        </div>
        <div className={`playerName ${nameLengthClass}`}>
          {renderName(name)}
        </div>
      </div>
    </div>
  );
}

export default PlayerCell;