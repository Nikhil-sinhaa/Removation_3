// lib/uploadthing.ts
import { generateReactHelpers } from "@uploadthing/react";
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Custom upload configuration
export const uploadConfig = {
  maxFileSize: "10MB",
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxFiles: 10,
} as const;

// Upload helper with progress tracking
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string } | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploadthing", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

// Validate file before upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size must be less than 10MB.",
    };
  }

  return { valid: true };
}

// Get optimized image URL
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "jpg" | "png";
  } = {}
): string {
  const { width = 1024, height, quality = 80, format = "webp" } = options;

  // If using UploadThing CDN, we can add optimization params
  if (url.includes("uploadthing.com") || url.includes("utfs.io")) {
    const params = new URLSearchParams();
    if (width) params.set("w", width.toString());
    if (height) params.set("h", height.toString());
    if (quality) params.set("q", quality.toString());
    if (format) params.set("f", format);

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${params.toString()}`;
  }

  return url;
}

// Generate thumbnail URL
export function getThumbnailUrl(url: string, size: number = 256): string {
  return getOptimizedImageUrl(url, { width: size, height: size, quality: 60 });
}

// Delete uploaded file
export async function deleteUploadedFile(fileKey: string): Promise<boolean> {
  try {
    const response = await fetch("/api/uploadthing/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileKey }),
    });

    return response.ok;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

// File type checker
export function getFileType(
  filename: string
): "image" | "document" | "unknown" {
  const extension = filename.split(".").pop()?.toLowerCase();
  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"];
  const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

  if (extension && imageExtensions.includes(extension)) return "image";
  if (extension && documentExtensions.includes(extension)) return "document";
  return "unknown";
}

// Convert File to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Convert base64 to File
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

// Compress image before upload
export async function compressImage(
  file: File,
  maxWidth: number = 2048,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// Resize image
export async function resizeImage(
  file: File,
  width: number,
  height: number
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        0.9
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// Get image dimensions
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
}

// Check if image is valid
export async function isValidImage(file: File): Promise<boolean> {
  try {
    const dimensions = await getImageDimensions(file);
    return dimensions.width > 0 && dimensions.height > 0;
  } catch {
    return false;
  }
}

export default {
  useUploadThing,
  uploadFiles,
  UploadButton,
  UploadDropzone,
  uploadConfig,
  uploadImage,
  validateFile,
  getOptimizedImageUrl,
  getThumbnailUrl,
  deleteUploadedFile,
  getFileType,
  fileToBase64,
  base64ToFile,
  compressImage,
  resizeImage,
  getImageDimensions,
  isValidImage,
};