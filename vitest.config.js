import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['game_engine/static/game_engine/js/__tests__/**/*.test.js'],
        environment: 'node',
    },
});
