import { Route, Routes } from 'react-router-dom';
import { QuotePreviewPage } from './pages/QuotePreviewPage/QuotePreviewPage';
import { Navbar } from './components/Navbar';

export const AppRouter = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={<QuotePreviewPage />}
        />
      </Routes>
    </>
  );
};
