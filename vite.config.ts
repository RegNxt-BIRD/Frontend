import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist", // Add this line
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            router: ["react-router-dom"],
            ui: [
              "@radix-ui/react-accordion",
              "@radix-ui/react-avatar",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-icons",
              "@radix-ui/react-label",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-slot",
              "@radix-ui/react-toast",
              "@radix-ui/react-tooltip",
            ],
            table: ["@tanstack/react-table", "@xyflow/react"],
            style: ["framer-motion", "tailwindcss-animate", "react-day-picker"],
          },
        },
      },
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 1500,
      sourcemap: true,
    },
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL
      ),
      "import.meta.env.VITE_FAST_API_BACKEND": JSON.stringify(
        env.VITE_FAST_API_BACKEND
      ),
    },
  };
});
