import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  isUploadOpen: boolean;
  libraryRevision: number;
  query: string;
  activeCategory: string;
  readerFontScale: number;
  isOutlineOpen: boolean;
  isAssistantOpen: boolean;
  setUploadOpen: (open: boolean) => void;
  refreshLibrary: () => void;
  setQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  setReaderFontScale: (scale: number) => void;
  toggleOutline: () => void;
  toggleAssistant: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isUploadOpen: false,
      libraryRevision: 0,
      query: "",
      activeCategory: "All documents",
      readerFontScale: 1,
      isOutlineOpen: true,
      isAssistantOpen: true,
      setUploadOpen: (isUploadOpen) => set({ isUploadOpen }),
      refreshLibrary: () => set((state) => ({ libraryRevision: state.libraryRevision + 1 })),
      setQuery: (query) => set({ query }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      setReaderFontScale: (readerFontScale) => set({ readerFontScale }),
      toggleOutline: () => set((state) => ({ isOutlineOpen: !state.isOutlineOpen })),
      toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
    }),
    {
      name: "ragbook-preferences-v1",
      partialize: (state) => ({
        readerFontScale: state.readerFontScale,
        isOutlineOpen: state.isOutlineOpen,
        isAssistantOpen: state.isAssistantOpen,
      }),
    },
  ),
);
