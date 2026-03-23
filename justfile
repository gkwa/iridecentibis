default: build

generate:
    tsx scripts/generate-stores.ts

build: generate
    node esbuild.config.mjs production

dev: generate
    node esbuild.config.mjs

install: build
    mkdir -p "/Users/mtm/Documents/Obsidian Vault/.obsidian/plugins/iridecentibis"
    cp main.js manifest.json "/Users/mtm/Documents/Obsidian Vault/.obsidian/plugins/iridecentibis/"
