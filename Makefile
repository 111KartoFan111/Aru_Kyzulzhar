# Makefile for Kyzyl Zhar Document Management System

.PHONY: help build up down restart logs clean test backup sample-data

# Default target
help:
	@echo "Kyzyl Zhar Document Management System"
	@echo "====================================="
	@echo ""
	@echo "Available commands:"
	@echo "  build        - Build all Docker images"
	@echo "  up           - Start all services"
	@echo "  down         - Stop all services"
	@echo "  restart      - Restart all services"
	@echo "  logs         - Show logs"
	@echo "  logs-backend - Show backend logs only"
	@echo "  logs-db      - Show database logs only"
	@echo "  clean        - Remove all containers and volumes"
	@echo "  test         - Run API tests"
	@echo "  backup       - Create database backup"
	@echo "  sample-data  - Create sample data for testing"
	@echo "  shell-backend - Open shell in backend container"
	@echo "  shell-db     - Open PostgreSQL shell"
	@echo "  install      - Initial setup and installation"

# Build Docker images
build:
	@echo "Building Docker images..."
	docker-compose build

# Start all services
up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose down

# Restart services
restart: down up

# Show logs for all services
logs:
	docker-compose logs -f

# Show backend logs only
logs-backend:
	docker-compose logs -f backend

# Show database logs only
logs-db:
	docker-compose logs -f db

# Clean up containers and volumes
clean:
	@echo "Removing containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "Cleanup completed!"

# Run API tests
test:
	@echo "Running API tests..."
	@sleep 5  # Wait for services to be ready
	cd backend && python api_tests.py

# Create database backup
backup:
	@echo "Creating database backup..."
	docker-compose exec backend python scripts/backup_database.py

# Create sample data
sample-data:
	@echo "Creating sample data..."
	docker-compose exec backend python scripts/create_sample_data.py

# Open backend container shell
shell-backend:
	docker-compose exec backend /bin/bash

# Open PostgreSQL shell
shell-db:
	docker-compose exec db psql -U user -d document_management

# Initial setup
install: build
	@echo "Performing initial setup..."
	docker-compose up -d db
	@echo "Waiting for database to be ready..."
	@sleep 10
	docker-compose up -d
	@echo "Creating sample data..."
	@sleep 10
	$(MAKE) sample-data
	@echo ""
	@echo "Installation completed!"
	@echo "====================================="
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "API Documentation: http://localhost:8000/docs"
	@echo ""
	@echo "Sample login credentials:"
	@echo "Admin: admin@kyzylzhar.kz / admin123"
	@echo "Manager: manager@kyzylzhar.kz / manager123"
	@echo "User: user@kyzylzhar.kz / user123"

# Development commands
dev-backend:
	@echo "Starting backend in development mode..."
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@echo "Starting frontend in development mode..."
	cd frontend && npm start

# Database commands
db-reset:
	@echo "Resetting database..."
	docker-compose exec db psql -U user -d document_management -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) sample-data

# Monitoring
status:
	@echo "Service Status:"
	@echo "==============="
	docker-compose ps

health:
	@echo "Health Check:"
	@echo "============="
	@curl -f http://localhost:8000/health || echo "Backend not responding"
	@curl -f http://localhost:3000 || echo "Frontend not responding"

# Production deployment
prod-build:
	@echo "Building for production..."
	docker-compose -f docker-compose.prod.yml build

prod-up:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	@echo "Stopping production environment..."
	docker-compose -f docker-compose.prod.yml down