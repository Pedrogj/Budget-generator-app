import { supabase } from "./supabaseClient";
import type { CompanyInfo } from "../types/types";

export const companyLogoBucket = "company-logos";
export const maxCompanyLogoSourceBytes = 1024 * 1024;
export const maxCompanyLogoDimension = 320;
export const companyLogoQuality = 0.82;
const maxOptimizedLogoBytes = 240 * 1024;

interface UploadCompanyLogoParams {
  companyId: string;
  logoBlob: Blob;
  previousPath?: string;
}

function getImageDimensions(source: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("No se pudo leer la imagen."));
    img.src = source;
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen."));
    img.src = source;
  });
}

function fileToDataUrl(file: File) {
  return blobToDataUrl(file);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("No se pudo optimizar el logo."));
      },
      type,
      quality,
    );
  });
}

async function renderImageToCanvas(source: string, maxDimension?: number) {
  const image = await loadImage(source);
  const scale = maxDimension
    ? Math.min(
        1,
        maxDimension / image.naturalWidth,
        maxDimension / image.naturalHeight,
      )
    : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Tu navegador no pudo optimizar el logo.");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

function renderCanvasOnWhiteBackground(canvas: HTMLCanvasElement) {
  const flattenedCanvas = document.createElement("canvas");
  flattenedCanvas.width = canvas.width;
  flattenedCanvas.height = canvas.height;

  const context = flattenedCanvas.getContext("2d");
  if (!context) {
    throw new Error("Tu navegador no pudo optimizar el logo.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, flattenedCanvas.width, flattenedCanvas.height);
  context.drawImage(canvas, 0, 0);
  return flattenedCanvas;
}

async function canvasToPdfFriendlyLogoBlob(canvas: HTMLCanvasElement) {
  const pngBlob = await canvasToBlob(canvas, "image/png", 1);

  if (pngBlob.size <= maxOptimizedLogoBytes) {
    return pngBlob;
  }

  return canvasToBlob(
    renderCanvasOnWhiteBackground(canvas),
    "image/jpeg",
    companyLogoQuality,
  );
}

export async function optimizeCompanyLogo(file: File) {
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    throw new Error("Usa una imagen PNG o JPG.");
  }

  if (file.size > maxCompanyLogoSourceBytes) {
    throw new Error("El logo original no debe superar 1 MB.");
  }

  const source = await fileToDataUrl(file);
  const canvas = await renderImageToCanvas(source, maxCompanyLogoDimension);

  return canvasToPdfFriendlyLogoBlob(canvas);
}

export async function validateCompanyLogoPreview(source: string) {
  return getImageDimensions(source);
}

export async function createCompanyLogoSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(companyLogoBucket)
    .createSignedUrl(path, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function resolveCompanyLogoForPdf(logoUrl?: string) {
  if (!logoUrl || logoUrl.startsWith("data:")) {
    return logoUrl;
  }

  try {
    const response = await fetch(logoUrl);
    if (!response.ok) throw new Error("No se pudo cargar el logo.");

    const source = await blobToDataUrl(await response.blob());
    const canvas = await renderImageToCanvas(source);

    return await blobToDataUrl(await canvasToPdfFriendlyLogoBlob(canvas));
  } catch (error) {
    console.warn("Could not prepare company logo for PDF", error);
    return logoUrl;
  }
}

export async function prepareCompanyLogoForPdf(company: CompanyInfo) {
  return {
    ...company,
    logoUrl: await resolveCompanyLogoForPdf(company.logoUrl),
  };
}

export async function uploadCompanyLogo({
  companyId,
  logoBlob,
  previousPath,
}: UploadCompanyLogoParams) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) {
    throw new Error("Debes iniciar sesión para guardar el logo");
  }

  const version = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const extension = logoBlob.type === "image/jpeg" ? "jpg" : "png";
  const path = `${userData.user.id}/${companyId}/logo-${version}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(companyLogoBucket)
    .upload(path, logoBlob, {
      cacheControl: "86400",
      contentType: logoBlob.type || "image/png",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  if (previousPath && previousPath !== path) {
    try {
      await removeCompanyLogo(previousPath);
    } catch (error) {
      console.warn("Could not remove previous company logo", error);
    }
  }

  return {
    path,
    signedUrl: await createCompanyLogoSignedUrl(path),
  };
}

export async function removeCompanyLogo(path: string) {
  const { error } = await supabase.storage
    .from(companyLogoBucket)
    .remove([path]);

  if (error) throw error;
}
