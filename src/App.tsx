import { BrowserRouter } from "react-router-dom";
import { QuoteProvider } from "./context/QuoteContext";
import { AppRouter } from "./AppRouter";
import { AuthProvider } from "./context/AuthContext";

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QuoteProvider>
          <AppRouter />
        </QuoteProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
