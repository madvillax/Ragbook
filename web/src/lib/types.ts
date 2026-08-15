export type DocumentStatus = "ready" | "processing" | "failed";

export interface Book {
  id: string;
  title: string;
  author: string;
  format: string;
  progress: number;
  status: DocumentStatus;
  updatedAt: string;
  pageCount: number;
  cover: string;
  category: string;
  errorMessage: string | null;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  position: number;
  pageStart: number;
  pageEnd: number;
  content: string;
  sourceLocation: Record<string, unknown>;
}

export interface DocumentDetail {
  id: string;
  title: string;
  author: string;
  format: string;
  status: DocumentStatus;
  progress: number;
  pageCount: number;
  createdAt: string;
  errorMessage: string | null;
  sections: DocumentSection[];
}

export interface Citation {
  id: string;
  label: string;
  sectionId: string | null;
  page: number;
  excerpt: string;
  sourceLocation: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  grounded?: boolean;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  grounded: boolean;
}
