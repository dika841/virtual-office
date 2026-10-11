.DEFAULT_GOAL := help

PNPM := pnpm
MOON := moon

.PHONY: help
help: ## Tampilkan daftar command
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Install dependensi seluruh monorepo
	$(PNPM) install

.PHONY: dev
dev: ## Jalankan API dan Web secara paralel
	$(PNPM) --filter "@virtual-office/api" --filter "@virtual-office/web" --parallel dev

.PHONY: dev-api
dev-api: ## Jalankan backend Cloudflare Workers API
	$(PNPM) --filter "@virtual-office/api" dev

.PHONY: dev-web
dev-web: ## Jalankan frontend Vite + PixiJS
	$(PNPM) --filter "@virtual-office/web" dev

.PHONY: db-generate
db-generate: ## Generate file migrasi Drizzle
	$(PNPM) --filter "@virtual-office/database" db:generate

.PHONY: db-push
db-push: ## Push skema Drizzle ke Neon PostgreSQL
	$(PNPM) --filter "@virtual-office/database" db:push

.PHONY: db-studio
db-studio: ## Buka UI Drizzle Studio
	$(PNPM) --filter "@virtual-office/database" db:studio

.PHONY: check
check: ## Jalankan Biome check & linter
	$(PNPM) run check

.PHONY: format
format: ## Format kode dengan Biome
	$(PNPM) run format

.PHONY: test
test: ## Jalankan unit test
	$(PNPM) run test

.PHONY: build
build: ## Build semua aplikasi & packages via moon
	$(PNPM) run build
