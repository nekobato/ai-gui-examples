import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-03-09",
  devtools: { enabled: true },
  modules: ["@nuxt/image"],
  imports: {
    dirs: ["composables"]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.BASE_API_URL
    }
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    },
    optimizeDeps: {
      include: ["mermaid"]
    }
  }
});
