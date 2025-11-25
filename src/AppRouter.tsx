import { Navigate, Route, Routes } from 'react-router-dom';
import { QuotePreviewPage } from './pages/QuotePreviewPage/QuotePreviewPage';
import { Navbar } from './components/Navbar';
import { QuoteFormPage } from './pages/QuoteFormPage/QuoteFormPage';

export const AppRouter = () => {
  return (
    <>
      <Navbar />
      {/* Router */}
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/quote/new"
              replace
            />
          }
        />
        <Route
          path="/quotes/new"
          element={<QuoteFormPage />}
        />
        <Route
          path="/quotes/preview"
          element={<QuotePreviewPage />}
        />
      </Routes>
    </>
  );
};
