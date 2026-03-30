import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "supabase/functions/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { 
      "@": path.resolve(__dirname, "./src"),
      "https://esm.sh/astronomy-engine@2.1.19": "astronomy-engine",
      "https://esm.sh/@supabase/supabase-js@2": "@supabase/supabase-js",
      "https://deno.land/std@0.168.0/http/server.ts": path.resolve(__dirname, "./supabase/functions/_shared/server_mock.ts")
    },
  },
});
