import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DeleteSummary = {
  storageFilesDeleted: number;
  quoteItemsDeleted: number;
  quotesDeleted: number;
  clientsDeleted: number;
  companiesDeleted: number;
  profileDeleted: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getAdminApiKey() {
  const secretKeys =
    Deno.env.get("SUPABASE_SECRET_KEYS") ?? Deno.env.get("SECRET_KEYS");

  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, string>;
      const defaultKey = parsed.default;
      const firstKey = Object.values(parsed).find(Boolean);

      if (defaultKey || firstKey) {
        return defaultKey ?? firstKey;
      }
    } catch (error) {
      console.warn("Admin secret keys value is not valid JSON", error);
    }
  }

  return (
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE")
  );
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const adminApiKey = getAdminApiKey();

    if (!adminApiKey) {
      throw new Error("Missing SUPABASE_SECRET_KEYS or SECRET_KEYS");
    }

    const authorization = req.headers.get("Authorization");
    const jwt = authorization?.replace(/^Bearer\s+/i, "");

    if (!jwt) {
      return jsonResponse({ error: "Missing user session" }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, adminApiKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid user session" }, 401);
    }

    const summary: DeleteSummary = {
      storageFilesDeleted: 0,
      quoteItemsDeleted: 0,
      quotesDeleted: 0,
      clientsDeleted: 0,
      companiesDeleted: 0,
      profileDeleted: false,
    };

    async function deleteStorageFolder(prefix: string): Promise<number> {
      let deleted = 0;
      let offset = 0;

      while (true) {
        const { data: objects, error: listError } = await supabaseAdmin.storage
          .from("quote-pdfs")
          .list(prefix, { limit: 1000, offset });

        if (listError) throw listError;
        if (!objects?.length) break;

        const filePaths: string[] = [];

        for (const object of objects) {
          const objectPath = prefix ? `${prefix}/${object.name}` : object.name;

          if (object.id) {
            filePaths.push(objectPath);
          } else {
            deleted += await deleteStorageFolder(objectPath);
          }
        }

        for (const paths of chunk(filePaths, 1000)) {
          const { error: removeError } = await supabaseAdmin.storage
            .from("quote-pdfs")
            .remove(paths);

          if (removeError) throw removeError;
          deleted += paths.length;
        }

        if (objects.length < 1000) break;
        offset += 1000;
      }

      return deleted;
    }

    summary.storageFilesDeleted = await deleteStorageFolder(user.id);

    const { data: companies, error: companiesError } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("profile_id", user.id);

    if (companiesError) throw companiesError;

    const companyIds = (companies ?? []).map((company) => company.id);

    if (companyIds.length > 0) {
      const { data: quotes, error: quotesError } = await supabaseAdmin
        .from("quotes")
        .select("id")
        .in("company_id", companyIds);

      if (quotesError) throw quotesError;

      const quoteIds = (quotes ?? []).map((quote) => quote.id);

      if (quoteIds.length > 0) {
        const { count: quoteItemsDeleted, error: quoteItemsError } =
          await supabaseAdmin
            .from("quote_items")
            .delete({ count: "exact" })
            .in("quote_id", quoteIds);

        if (quoteItemsError) throw quoteItemsError;
        summary.quoteItemsDeleted = quoteItemsDeleted ?? 0;

        const { count: quotesDeleted, error: deleteQuotesError } =
          await supabaseAdmin
            .from("quotes")
            .delete({ count: "exact" })
            .in("id", quoteIds);

        if (deleteQuotesError) throw deleteQuotesError;
        summary.quotesDeleted = quotesDeleted ?? 0;
      }

      const { count: clientsDeleted, error: clientsError } = await supabaseAdmin
        .from("clients")
        .delete({ count: "exact" })
        .in("company_id", companyIds);

      if (clientsError) throw clientsError;
      summary.clientsDeleted = clientsDeleted ?? 0;

      const { count: companiesDeleted, error: deleteCompaniesError } =
        await supabaseAdmin
          .from("companies")
          .delete({ count: "exact" })
          .in("id", companyIds);

      if (deleteCompaniesError) throw deleteCompaniesError;
      summary.companiesDeleted = companiesDeleted ?? 0;
    }

    const { count: profilesDeleted, error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete({ count: "exact" })
      .eq("id", user.id);

    if (profileError) throw profileError;
    summary.profileDeleted = (profilesDeleted ?? 0) > 0;

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
      false,
    );

    if (deleteUserError) throw deleteUserError;

    return jsonResponse({ deleted: true, summary });
  } catch (error) {
    console.error("delete-account failed", error);

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo eliminar la cuenta";

    return jsonResponse({ error: message }, 500);
  }
});
