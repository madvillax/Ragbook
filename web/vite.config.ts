import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 4,
            },
            {
              name: "tanstack-vendor",
              test: /node_modules[\\/]@tanstack[\\/]/,
              priority: 3,
            },
            {
              name: "motion-vendor",
              test: /node_modules[\\/]motion[\\/]|node_modules[\\/]motion-dom[\\/]|node_modules[\\/]motion-utils[\\/]/,
              priority: 2,
            },
            {
              name: "ui-vendor",
              test: /node_modules[\\/](@base-ui|@phosphor-icons)[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
});
