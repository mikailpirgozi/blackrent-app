// import { screenGraphPlugin } from "@animaapp/vite-plugin-screen-graph";
// import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
// import { defineConfig } from "vite";

// https://vite.dev/config/
export default {
  plugins: [],
  publicDir: "./static",
  base: "./",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
};
