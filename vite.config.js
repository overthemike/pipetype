// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
import typescript from 'rollup-plugin-typescript2'
import dts from 'vite-plugin-dts'

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/main.ts'),
			name: 'pipetype',
			fileName: 'pipetype',
		},
		rollupOptions: {
			// Rollup specific options
			external: [],
			output: {
				exports: 'named',
				globals: {},
			},
		},
		plugins: [
			typescript(),
			dts({
				entryRoot: 'src',
			}),
		], // Moved to correct location
		emptyOutDir: false,
	},
})
