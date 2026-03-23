default: build

generate:
    pnpm run generate

build:
    pnpm run build

dev:
    pnpm run dev

install: build
    mkdir -p "/Users/mtm/Documents/Obsidian Vault/.obsidian/plugins/iridecentibis"
    cp main.js manifest.json "/Users/mtm/Documents/Obsidian Vault/.obsidian/plugins/iridecentibis/"
