import { supabase } from "./supabaseClient";

export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

export async function updateRecoveredPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) throw error;
}
