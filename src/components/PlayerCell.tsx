import React from "react";

interface PlayerProps {
  player: {
    name: string;
    url: string;
  } | null; // 允許傳入 null
}

function PlayerCell({ player }: PlayerProps) {
  // 如果沒有 player 資料，渲染「空膠囊」佔位格
  if (!player) {
    return (
      <div 
        className="playerCell empty" 
        style={{
          width: "100%",
          aspectRatio: "1/1",
          borderRadius: "50%", // 膠囊/圓形感
          border: "2px dashed rgba(255, 255, 255, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.05)",
          boxSizing: "border-box"
        }}
      >
        {/* 你可以在這裡放一個加號圖示或是純文字 */}
        <span style={{ color: "rgba(255, 255, 255, 0.2)", fontSize: "24px" }}>+</span>
      </div>
    );
  }

  // 如果有 player 資料，正常渲染
  const { name, url } = player;

  return (
    <div className="playerCell">
      <img
        src={url} 
        alt={name}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}

export default PlayerCell;