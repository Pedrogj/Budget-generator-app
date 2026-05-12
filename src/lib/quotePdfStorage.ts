import { supabase } from "./supabaseClient";
import type { QuoteTemplateId } from "../types/types";

export const quotePdfBucket = "quote-pdfs";

interface UploadQuotePdfParams {
  companyId: string;
  quoteId: string;
  fileName: string;
  pdfBlob: Blob;
  templateId: QuoteTemplateId;
}

function toStorageFileName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "presupuesto.pdf";
}

export async function uploadQuotePdf({
  companyId,
  quoteId,
  fileName,
  pdfBlob,
  templateId,
}: UploadQuotePdfParams) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) {
    throw new Error("Debes iniciar sesión para guardar el PDF");
  }

  const safeFileName = toStorageFileName(fileName).replace(/\.pdf$/i, "");
  const generatedAt = new Date().toISOString();
  const version = generatedAt.replace(/[-:.TZ]/g, "");
  const path = `${userData.user.id}/${companyId}/${quoteId}/${safeFileName}-${templateId}-${version}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(quotePdfBucket)
    .upload(path, pdfBlob, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("quotes")
    .update({
      pdf_path: path,
      pdf_template_id: templateId,
      pdf_generated_at: generatedAt,
    })
    .eq("id", quoteId)
    .eq("company_id", companyId);

  if (updateError) throw updateError;

  return {
    path,
    generatedAt,
    templateId,
  };
}

export async function createQuotePdfSignedUrl(path: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from(quotePdfBucket)
    .createSignedUrl(path, 60, {
      download: fileName,
    });

  if (error) throw error;
  return data.signedUrl;
}

export async function createQuotePdfPreviewUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(quotePdfBucket)
    .createSignedUrl(path, 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function removeQuotePdf(path: string) {
  const { error } = await supabase.storage.from(quotePdfBucket).remove([path]);

  if (error) throw error;
}
