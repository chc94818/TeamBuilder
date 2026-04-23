import PlayerCell from "./PlayerCell";
import { useTeam } from "../context/Team";

function Bench() {
  const { benchPlayers, lineupPlayers, addToLineup } = useTeam();

  return (
    <div className="benchContainer">
      <h3>
        Available Players ({benchPlayers.length})
      </h3>
      
      <div 
        className="bench"
      >
        {benchPlayers.map((player) => {
          const isUsed = lineupPlayers.some((p) => p?.id === player.id);

          return (
            <div 
              className="benchPlayerCellContainer"
              key={player.id} 
              onClick={() => !isUsed && addToLineup(player)}
              style={{ 
                cursor: isUsed ? "not-allowed" : "pointer",
                opacity: isUsed ? 0.2 : 1,
                filter: isUsed ? "grayscale(1) brightness(0.5)" : "none",
                transition: "all 0.2s ease",
                borderColor: isUsed ? "transparent" : "rgba(255,255,255,0.1)",
                
              }}
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

export default Bench
