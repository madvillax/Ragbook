import type { Book, ChatResponse, DocumentDetail } from "./types";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

interface DocumentDetailWire {
  id: string;
  title: string;
  author: string;
  format: string;
  status: DocumentDetail["status"];
  progress: number;
  page_count: number;
  created_at: string;
  error_message: string | null;
  sections: Array<{
    id: string;
    title: string;
    level: number;
    position: number;
    page_start: number;
    page_end: number;
    content: string;
    source_location: Record<string, unknown>;
  }>;
}

interface ChatResponseWire {
  answer: string;
  grounded: boolean;
  citations: Array<{
    id: string;
    label: string;
    section_id: string | null;
    page: number;
    excerpt: string;
    source_location: Record<string, unknown>;
  }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail ?? `Request failed with status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export async function listDocuments(): Promise<Book[]> {
  return request<Book[]>("/api/v1/documents");
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const document = await request<DocumentDetailWire>(`/api/v1/documents/${documentId}`);
  return {
    id: document.id,
    title: document.title,
    author: document.author,
    format: document.format,
    status: document.status,
    progress: document.progress,
    pageCount: document.page_count,
    createdAt: document.created_at,
    errorMessage: document.error_message,
    sections: document.sections.map((section) => ({
      id: section.id,
      title: section.title,
      level: section.level,
      position: section.position,
      pageStart: section.page_start,
      pageEnd: section.page_end,
      content: section.content,
      sourceLocation: section.source_location,
    })),
  };
}

export async function uploadDocument(file: File): Promise<{ id: string; status: string }> {
  const body = new FormData();
  body.append("file", file);
  return request<{ id: string; status: string }>("/api/v1/documents", {
    method: "POST",
    body,
  });
}

export async function askDocument(documentId: string, question: string): Promise<ChatResponse> {
  const response = await request<ChatResponseWire>("/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });
  return {
    answer: response.answer,
    grounded: response.grounded,
    citations: response.citations.map((citation) => ({
      id: citation.id,
      label: citation.label,
      sectionId: citation.section_id,
      page: citation.page,
      excerpt: citation.excerpt,
      sourceLocation: citation.source_location,
    })),
  };
}
