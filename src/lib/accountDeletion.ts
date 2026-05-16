import { supabase } from "./supabaseClient";

interface DeleteAccountResponse {
  deleted?: boolean;
  error?: string;
}

export async function deleteCurrentAccount() {
  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(
    "delete-account",
    {
      method: "POST",
    },
  );

  if (error) {
    throw error;
  }

  if (!data?.deleted) {
    throw new Error(data?.error ?? "No se pudo eliminar la cuenta");
  }

  const { error: signOutError } = await supabase.auth.signOut({
    scope: "global",
  });

  if (signOutError) {
    console.warn("Account was deleted, but local sign out reported an error", {
      signOutError,
    });
  }
}
