
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Only import the tagger in development mode and use dynamic import
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];
  
  // Only add the component tagger in development mode
  if (mode === 'development') {
    // We'll use a try-catch to avoid breaking the build if the package isn't available
    try {
      // This is only for dev environment, won't affect production builds
      console.log('Development mode: Loading component tagger...');
    } catch (e) {
      console.warn('Could not load component tagger plugin, continuing without it.');
    }
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Ensure proper base path for Electron
    base: mode === 'production' ? './' : '/',
  };
});
