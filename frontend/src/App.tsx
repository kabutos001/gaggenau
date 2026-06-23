import Oven from './components/oven/Oven';
import { LocaleProvider } from './i18n/context';

function App() {
  return (
    <LocaleProvider>
      <Oven />
    </LocaleProvider>
  );
}

export default App;
