import { Navigate, Route, Routes } from 'react-router-dom';
import { QuotePreviewPage } from './pages/QuotePreviewPage/QuotePreviewPage';
import { Navbar } from './components';
import { QuoteFormPage } from './pages/QuoteFormPage/QuoteFormPage';
import { ProfilePage } from './pages/ProfilePage/ProfilePage';

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
              to="/quotes/new"
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
        <Route
          path="/profile"
          element={<ProfilePage />}
        />
      </Routes>
    </>
  );
};
