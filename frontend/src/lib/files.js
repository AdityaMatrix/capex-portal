import axios from "axios";
import { API, BACKEND_URL } from "@/lib/api";

/**
 * Upload a single file to the backend.
 * Auth is added by the global axios interceptor, and axios sets the
 * multipart boundary itself when given FormData.
 * @returns {Promise<{ id: string, file_id: string, url: string }>}
 */
export async function uploadFile(file, fields = {}) {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const { data } = await axios.post(`${API}/files/upload`, formData);
  return data;
}

/** Backend returns relative "/api/..." URLs; make them absolute. */
export function resolveFileUrl(url) {
  if (!url) return url;
  return url.startsWith("/api") ? `${BACKEND_URL}${url}` : url;
}

/** True when the URL points at our own (authenticated) API. */
export function isApiUrl(url) {
  if (!url) return false;
  return url.startsWith("/api") || url.startsWith(API);
}

/**
 * Download an authenticated file. A plain <a href> can't send the bearer
 * token, so fetch it as a blob and trigger the download from an object URL.
 */
export async function downloadAuthenticatedFile(url, filename = "download") {
  const response = await axios.get(resolveFileUrl(url), { responseType: "blob" });
  const objectUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
