interface PlayerProps {
  player: {
    name: string;
    url: string;
  } | null; // 允許傳入 null
}

function PlayerCell({ player }: PlayerProps) {
  if (!player) {
    return <div className="playerCell empty"></div>;
  }

  // 如果有 player 資料，正常渲染
  const { name, url } = player;

  return (
    <div className="playerCell">
      <img
        src={url}
        alt={name}
      />
    </div>
  );
}

export default PlayerCell;
