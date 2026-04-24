import PlayerCell from "./PlayerCell";
import { useTeam } from "../context/Team";

function Bench() {
  const { benchPlayers, lineupPlayers, addToLineup } = useTeam();

  return (
    <div className="benchContainer">
      <h3>Available Players ({benchPlayers.length})</h3>

      <div className="bench">
        {benchPlayers.map((player) => {
          const isUsed = lineupPlayers.some((p) => p?.id === player.id);

          return (
            <div
              className={`benchPlayerCellContainer ${isUsed && "disabled"}`}
              key={player.id}
              onClick={() => !isUsed && addToLineup(player)}
            >
              {/* 這裡直接放 PlayerCell */}
              <PlayerCell player={player} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Bench;
