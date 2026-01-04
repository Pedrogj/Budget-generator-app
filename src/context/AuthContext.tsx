import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
// Si tienes @supabase/supabase-js instalado, puedes tipar el user:
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(user: SupabaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? undefined, // <- evita el error de string | null
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sesión inicial + listener de cambios de auth
  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session", error);
        setUser(null);
      } else {
        const sessionUser = data.session?.user ?? null;
        setUser(mapSupabaseUser(sessionUser));
      }
      setLoading(false);
    };

    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user ?? null;
        setUser(mapSupabaseUser(sessionUser));
        setLoading(false);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error in login", error);
      throw error;
    }

    setUser(mapSupabaseUser(data.user));
  };

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error in register", error);
      throw error;
    }

    // Dependiendo de tu configuración, puede requerir confirmación por email
    // Por simplicidad, no hacemos setUser aquí; el usuario hará login luego.
    if (data.user) {
      console.log("User registered, email may need confirmation");
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error in logout", error);
      throw error;
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
