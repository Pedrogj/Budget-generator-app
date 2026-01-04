import { Route, Routes } from "react-router-dom";
import { QuotePreviewPage } from "./pages/QuotePreviewPage/QuotePreviewPage";
import { Navbar } from "./components";
import { QuoteFormPage } from "./pages/QuoteFormPage/QuoteFormPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { ClientsPage } from "./pages/ClientsPage/ClientsPage";
import { RequiredAuth } from "./components/RequiredAuth/RequiredAuth";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";

export const AppRouter = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <RequiredAuth>
                <QuoteFormPage />
              </RequiredAuth>
            }
          />
          <Route
            path="/quotes/new"
            element={
              <RequiredAuth>
                <QuoteFormPage />
              </RequiredAuth>
            }
          />
          <Route
            path="/quotes/preview"
            element={
              <RequiredAuth>
                <QuotePreviewPage />
              </RequiredAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequiredAuth>
                <ProfilePage />
              </RequiredAuth>
            }
          />
          <Route
            path="/clients"
            element={
              <RequiredAuth>
                <ClientsPage />
              </RequiredAuth>
            }
          />

          {/* 404 */}
          <Route path="*" element={<p>Página no encontrada</p>} />
        </Routes>
      </main>
    </div>
  );
};
