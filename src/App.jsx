import { GameProvider, useGame } from './state/gameStore.jsx';
import SetupScreen from './screens/SetupScreen.jsx';
import DraftScreen from './screens/DraftScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';

function Router() {
  const { game } = useGame();
  if (game.phase === 'draft') return <DraftScreen />;
  if (game.phase === 'results') return <ResultsScreen />;
  return <SetupScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <div className="app">
        <Router />
      </div>
    </GameProvider>
  );
}
