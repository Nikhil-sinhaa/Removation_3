// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// CORE UTILITIES
// ============================================

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// CURRENCY UTILITIES
// ============================================

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED";

export const currencySymbols: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
};

export const currencyLocales: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "ar-AE",
};

/**
 * Format amount to currency string
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "INR",
  options?: Intl.NumberFormatOptions
): string {
  const locale = currencyLocales[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format amount in Indian numbering system (Lakhs, Crores)
 */
export function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

/**
 * Convert between currencies (approximate rates - should use API for real-time)
 */
export const exchangeRates: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  const inINR = amount / exchangeRates[from];
  return inINR * exchangeRates[to];
}

/**
 * Format compact number (1K, 1M, 1B)
 */
export function formatCompactNumber(num: number): string {
  const formatter = Intl.NumberFormat("en", { notation: "compact" });
  return formatter.format(num);
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format date to readable string
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate random string
 */
export function generateId(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const maskedLocal =
    local.charAt(0) + "*".repeat(Math.max(local.length - 2, 1)) + local.slice(-1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Extract initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================
// NUMBER UTILITIES
// ============================================

/**
 * Clamp number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Round to decimal places
 */
export function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundTo((value / total) * 100, 1);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Group array by key
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 */
export function sortBy<T>(
  arr: T[],
  key: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Pick random item from array
 */
export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// OBJECT UTILITIES
// ============================================

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Omit keys from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Pick keys from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as object, source[key] as object);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: unknown): item is object {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

// ============================================
// ASYNC UTILITIES
// ============================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2, onError } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      onError?.(error as Error, attempt);
      await sleep(delay * Math.pow(backoff, attempt - 1));
    }
  }

  throw new Error("Max attempts reached");
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// URL UTILITIES
// ============================================

/**
 * Build URL with query params
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Parse query params from URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const params = new URL(url).searchParams;
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Check if URL is valid
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// ============================================
// IMAGE UTILITIES
// ============================================

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 to blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

/**
 * Resize image
 */
export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to resize image"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Check if file is image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB to Hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Get contrasting text color
 */
export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#000000";
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

/**
 * Generate random color
 */
export function randomColor(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone (Indian format)
 */
export function isValidIndianPhone(phone: string): boolean {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone.replace(/[\s-]/g, ""));
}

/**
 * Validate URL
 */
export function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ============================================
// STORAGE UTILITIES
// ============================================

/**
 * Safe localStorage get
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage set
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

/**
 * Remove from localStorage
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove from localStorage:", error);
  }
}

// ============================================
// DEVICE UTILITIES
// ============================================

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Check if running on client
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Check if mobile device
 */
export function isMobile(): boolean {
  if (isServer()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if touch device
 */
export function isTouchDevice(): boolean {
  if (isServer()) return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  if (isServer()) return 1;
  return window.devicePixelRatio || 1;
}

// ============================================
// CLIPBOARD UTILITIES
// ============================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Read from clipboard
 */
export async function readFromClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return "";
  }
}

// ============================================
// ANIMATION UTILITIES
// ============================================

/**
 * Ease out cubic
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in out cubic
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(elementId: string, offset: number = 0): void {
  const element = document.getElementById(elementId);
  if (element) {
    const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

// ============================================
// ERROR UTILITIES
// ============================================

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * Get error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

/**
 * Create API error response
 */
export function createApiError(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================
// VASTU UTILITIES
// ============================================

/**
 * Convert degrees to direction
 */
export function degreesToDirection(degrees: number): string {
  const directions = [
    "North",
    "North-East",
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
  ];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Get Vastu color based on score
 */
export function getVastuScoreColor(score: number): string {
  if (score >= 80) return "#22c55e"; // Green
  if (score >= 60) return "#eab308"; // Yellow
  if (score >= 40) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

/**
 * Get Vastu grade based on score
 */
export function getVastuGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Average";
  if (score >= 50) return "Below Average";
  return "Needs Improvement";
}

// ============================================
// COST UTILITIES
// ============================================

/**
 * Calculate area in square feet
 */
export function calculateArea(
  length: number,
  width: number,
  unit: "ft" | "m" = "ft"
): number {
  const area = length * width;
  return unit === "m" ? area * 10.764 : area;
}

/**
 * Calculate renovation cost per sqft
 */
export function calculateCostPerSqft(
  totalCost: number,
  area: number
): number {
  if (area === 0) return 0;
  return roundTo(totalCost / area, 0);
}

/**
 * Apply GST to amount (India)
 */
export function applyGST(amount: number, gstRate: number = 18): number {
  return amount * (1 + gstRate / 100);
}

/**
 * Get GST amount
 */
export function getGSTAmount(amount: number, gstRate: number = 18): number {
  return amount * (gstRate / 100);
}

// ============================================
// EXPORT ALL
// ============================================

export const utils = {
  cn,
  formatCurrency,
  formatIndianCurrency,
  convertCurrency,
  formatCompactNumber,
  formatDate,
  formatRelativeTime,
  isToday,
  getGreeting,
  truncate,
  titleCase,
  slugify,
  generateId,
  generateUUID,
  maskEmail,
  getInitials,
  clamp,
  roundTo,
  percentage,
  lerp,
  mapRange,
  chunk,
  unique,
  shuffle,
  groupBy,
  sortBy,
  randomItem,
  deepClone,
  omit,
  pick,
  isEmpty,
  deepMerge,
  sleep,
  retry,
  debounce,
  throttle,
  buildUrl,
  parseQueryParams,
  isValidUrl,
  getDomain,
  getImageDimensions,
  fileToBase64,
  base64ToBlob,
  resizeImage,
  formatFileSize,
  getFileExtension,
  isImageFile,
  hexToRgb,
  rgbToHex,
  getContrastColor,
  randomColor,
  isValidEmail,
  isValidIndianPhone,
  isValidHttpUrl,
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  isServer,
  isClient,
  isMobile,
  isTouchDevice,
  getDevicePixelRatio,
  copyToClipboard,
  readFromClipboard,
  easeOutCubic,
  easeInOutCubic,
  smoothScrollTo,
  safeJsonParse,
  getErrorMessage,
  createApiError,
  degreesToDirection,
  getVastuScoreColor,
  getVastuGrade,
  calculateArea,
  calculateCostPerSqft,
  applyGST,
  getGSTAmount,
};