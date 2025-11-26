.PHONY: help up down build logs restart clean db-migrate db-studio

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

build: ## Build and start all services
	docker-compose up -d --build

logs: ## View logs from all services
	docker-compose logs -f

restart: ## Restart all services
	docker-compose restart

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v

db-migrate: ## Run database migrations
	docker-compose exec app npx prisma migrate deploy

db-studio: ## Open Prisma Studio
	npx prisma studio

dev: ## Start local development server
	npm run dev

install: ## Install dependencies
	npm install

setup: install ## Setup project for first time
	cp .env.example .env
	@echo "✅ Setup complete! Please edit .env with your configuration"
	@echo "Then run 'make up' to start the services"
