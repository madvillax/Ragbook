import type { Book } from "./types";
import { books as sampleBooks } from "./mock-data";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function listDocuments(): Promise<Book[]> {
  if (!API_URL) return sampleBooks;

  const response = await fetch(`${API_URL}/api/v1/documents`);
  if (!response.ok) throw new Error("Could not load your library.");
  return response.json() as Promise<Book[]>;
}

export async function uploadDocument(file: File): Promise<{ id: string; status: string }> {
  if (!API_URL) {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    return { id: crypto.randomUUID(), status: "processing" };
  }

  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api/v1/documents`, { method: "POST", body });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(detail?.detail ?? "Upload failed. Please try again.");
  }
  return response.json() as Promise<{ id: string; status: string }>;
}

