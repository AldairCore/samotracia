import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  // basicSsl: certificado autofirmado para probar desde el teléfono en la misma red Wi-Fi
  // (Spotify exige HTTPS salvo para 127.0.0.1, que el teléfono no puede usar).
  plugins: [vue(), basicSsl()],
  server: { host: '0.0.0.0', port: 5173 },
  /** El .env vive en la raíz del monorepo, junto a .env.example, no en apps/web. */
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
});
