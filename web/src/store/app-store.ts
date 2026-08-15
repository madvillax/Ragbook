import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  isUploadOpen: boolean;
  query: string;
  activeCategory: string;
  readerFontScale: number;
  isOutlineOpen: boolean;
  isAssistantOpen: boolean;
  setUploadOpen: (open: boolean) => void;
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
      query: "",
      activeCategory: "All documents",
      readerFontScale: 1,
      isOutlineOpen: true,
      isAssistantOpen: true,
      setUploadOpen: (isUploadOpen) => set({ isUploadOpen }),
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
