interface PlayerProps {
  player: {
    name: string;
    url: string;
  } | null; // 允許傳入 null
}

const NAME_LENGTH_MAP = {
  SHORT: 4,
  MEDIUM: 10,
  LONG: 14,
};

function PlayerCell({ player }: PlayerProps) {
  if (!player) {
    return <div className="playerCell empty"></div>;
  }

  // 如果有 player 資料，正常渲染
  const { name, url } = player;

  const getNameClass = (name: string): string => {
    const parts = name.split(/(?=[&(\(])/g);

    const maxLineLength = Math.max(...parts.map((part) => part.length));
    if (maxLineLength <= NAME_LENGTH_MAP["SHORT"]) return "large";
    if (maxLineLength <= NAME_LENGTH_MAP["MEDIUM"]) return "medium";
    if (maxLineLength <= NAME_LENGTH_MAP["LONG"]) return "small";
    return "MEDIUM"; // 最長的情況
  };

  const renderName = (name: string) => {
    // 使用正向預查 (?=[&(\()])
    // 這表示：在 & 或 ( 之前進行切割，但保留符號在後面的字串中
    const parts = name.split(/(?=[&(\(])/g);

    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && <br />}
      </span>
    ));
  };
  const nameLengthClass = getNameClass(name);

  // const nameSplit = name.split('&');
  return (
    <div className="playerCellV2">
      <div className="playerImg">
        <img src={url} alt={name} />
      </div>
      <div className={`playerName ${nameLengthClass}`}>
        {renderName(name)}
        {/* {nameSplit[0] && <span>{nameSplit[0]}</span>}
        {nameSplit[1] && <span>{nameSplit[1]}</span>} */}
      </div>
    </div>
  );
}

export default PlayerCell;
