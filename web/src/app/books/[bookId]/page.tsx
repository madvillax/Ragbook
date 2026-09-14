import type { Metadata } from "next";
import { ReaderPage } from "../../../features/reader/reader-page";

export const metadata: Metadata = {
  title: "Reader",
};

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { bookId } = await params;
  return <ReaderPage bookId={bookId} />;
}
