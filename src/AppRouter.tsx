import { Route, Routes } from 'react-router-dom';
import { QuotePreviewPage } from './pages/QuotePreviewPage/QuotePreviewPage';

export const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<QuotePreviewPage />}
      />
    </Routes>
  );
};
