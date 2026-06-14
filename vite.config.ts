import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";
import { defineConfig } from "vite";

/** Cho phép nhúng trong Gmail iframe; * = mọi ancestor (dev/ngrok). Production: dùng header trên Vercel. */
const FRAME_ANCESTORS_CSP = "frame-ancestors *;";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    allowedHosts: true,
    headers: {
      "Content-Security-Policy": FRAME_ANCESTORS_CSP,
    },
  },
  preview: {
    headers: {
      "Content-Security-Policy": FRAME_ANCESTORS_CSP,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      routes: path.resolve(__dirname, "src/routes.tsx"),
    },
  },
});
