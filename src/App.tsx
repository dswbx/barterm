import { TerminalManager } from './components/TerminalManager';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <TerminalManager />
    </SettingsProvider>
  );
}

export default App;
