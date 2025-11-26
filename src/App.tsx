import { BrowserRouter } from 'react-router-dom';
import { QuoteProvider } from './context/QuoteContext';
import { AppRouter } from './AppRouter';

export const App = () => {
  return (
    <BrowserRouter>
      <QuoteProvider>
        <AppRouter />
      </QuoteProvider>
    </BrowserRouter>
  );
};
