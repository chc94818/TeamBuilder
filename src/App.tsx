// App.tsx
import { useRef } from "react";
import background from "./assets/background/4team_e.jpg";
import "./styles/App.css";
import Bench from "./components/Bench";
import Lineup, { type LineupBoardHandle } from "./components/Lineup";
import EditorTool from "./components/EditorTool";
import { EditorProvider } from "./context/Editor";
import { TeamProvider } from "./context/Team";

function App() {
  const lineupRef = useRef<LineupBoardHandle>(null);

  const handleExportImage = async (targetWidth: number) => {
    if (lineupRef.current) {
      const base64 = await lineupRef.current.exportLineupImage(targetWidth);
      if (base64) {
        const link = document.createElement("a");
        link.href = base64;
        link.download = `lineup_${targetWidth}px.png`;
        link.click();
      }
    }
  };

  return (
    <EditorProvider>
      <TeamProvider>
        <section id="top">
          <EditorTool onExport={handleExportImage} />
        </section>
        <section id="center">
          <section id="centerLeft">
            {/* 現在 Lineup 和 Bench 內部會直接透過 useTeam 拿資料，不再需要傳 playerList */}
            <Lineup ref={lineupRef} background={background} />

          </section>
          <section id="centerRight">
            <Bench />
          </section>
        </section>
        <section id="spacer"></section>
      </TeamProvider>
    </EditorProvider>
  );
}

export default App;