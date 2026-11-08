/**
 * Formula Injection & Cross-Site Scripting (XSS) Sanitizer
 * Mitigates CSV Formula Injection (DDE) and stored DOM XSS.
 */

export function stripBom(input: string): string {
  if (!input) return "";
  if (input.charCodeAt(0) === 0xFEFF) {
    return input.slice(1);
  }
  return input;
}

export function sanitizeCsvField(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  
  // Protect against CSV Formula Injection: =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

