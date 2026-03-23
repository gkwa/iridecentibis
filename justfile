default: install

generate:
    pnpm run generate

build: generate
    pnpm run build

dev: generate
    pnpm run dev

install: build
    mkdir -p "/Users/mtm/Documents/Obsidian Vault/.obsidian/plugins/iridecentibis"
    cp main.js manifest.json "/Users/mtm/Documents/Obsidian Vault/.obsidian/plugins/iridecentibis/"
