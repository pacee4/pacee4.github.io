import { defineConfig } from 'vite';
import { resolve } from "path";

export default defineConfig({
    server: {
        host: "localhost",
        port: 5173
    },
    build: {
        emptyOutDir: true,
        rolldownOptions: {
            // Точки входа
            input: {
                main: resolve(__dirname, 'index.html'),
                games: resolve(__dirname, 'games/index.html'),
                projects: resolve(__dirname, 'projects/index.html'),
                gallery: resolve(__dirname, 'gallery/index.html'),
            },
        },
    },
    resolve: {
        alias: {
            // Настраиваем символ @ как ссылку на папку /src
            '@': resolve(__dirname, './src'),
        },
    }
});