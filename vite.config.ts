import {defineConfig} from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
import ffmpeg from '@motion-canvas/ffmpeg';

export default defineConfig({
  plugins: [
    motionCanvas({
      project: [
        "./src/projects/pyramids/pyramids.ts",
        "./src/projects/circle-grids/circle-grids.ts",
      ],
    }),
    ffmpeg(),
  ],
});
