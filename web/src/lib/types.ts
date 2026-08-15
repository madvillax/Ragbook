export type DocumentStatus = "ready" | "processing" | "failed";

export interface Book {
  id: string;
  title: string;
  author: string;
  format: "PDF" | "DOCX" | "PPTX" | "TXT" | "MD" | "EPUB";
  progress: number;
  status: DocumentStatus;
  lastOpened: string;
  pageCount: number;
  cover: string;
  category: string;
}

export interface Section {
  id: string;
  title: string;
  level: number;
  page: number;
}

export interface Citation {
  id: string;
  label: string;
  sectionId: string;
  page: number;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

