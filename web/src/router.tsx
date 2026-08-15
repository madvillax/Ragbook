import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { LibraryPage } from "./pages/library-page";
import { LazyReaderRoute } from "./components/reader/lazy-reader-route";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main className="grid min-h-[100dvh] place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">This page is not in your library.</h1>
        <a href="/" className="mt-4 inline-block text-sm font-medium text-accent-600">Return to library</a>
      </div>
    </main>
  ),
});

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LibraryPage,
});

const readerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/books/$bookId",
  component: LazyReaderRoute,
});

const routeTree = rootRoute.addChildren([libraryRoute, readerRoute]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
