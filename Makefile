# VitalDB Viewer Makefile
# ========================
#
# Usage:
#   make dev        - Start development server
#   make build      - Production build (multiple files)
#   make standalone - Build single HTML file (open directly in browser)
#   make preview    - Preview production build
#   make clean      - Remove build artifacts
#   make install    - Install dependencies
#   make help       - Show this help

.PHONY: all dev build standalone preview clean install help

# Default target
all: build

# ─────────────────────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────────────────────

## Start development server with hot reload
dev:
	@echo "Starting development server..."
	@cd src && bun run dev

## Install dependencies
install:
	@echo "Installing dependencies..."
	@cd src && bun install

# ─────────────────────────────────────────────────────────────
# Production Build
# ─────────────────────────────────────────────────────────────

## Build for production (multiple files, best performance)
build:
	@echo "Building for production..."
	@cd src && bun run build
	@echo "Build complete: src/dist/"

## Build single HTML file (can open directly in browser without server)
standalone:
	@echo "Building standalone HTML..."
	@cd src && bun run build:standalone
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Standalone build complete!"
	@echo "  Output: src/dist/vitaldb-viewer.html"
	@echo ""
	@echo "  You can open this file directly in your browser:"
	@echo "    open src/dist/vitaldb-viewer.html"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

## Preview production build
preview:
	@echo "Starting preview server..."
	@cd src && bun run preview

# ─────────────────────────────────────────────────────────────
# Maintenance
# ─────────────────────────────────────────────────────────────

## Remove build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf src/dist
	@rm -rf src/node_modules/.vite
	@echo "Clean complete."

## Deep clean (including node_modules)
clean-all: clean
	@echo "Removing node_modules..."
	@rm -rf src/node_modules
	@echo "Deep clean complete."

# ─────────────────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────────────────

## Show help
help:
	@echo ""
	@echo "VitalDB Viewer - Build Commands"
	@echo "================================"
	@echo ""
	@echo "Development:"
	@echo "  make install     Install dependencies"
	@echo "  make dev         Start development server (localhost:5173)"
	@echo ""
	@echo "Production:"
	@echo "  make build       Build for production (multiple files)"
	@echo "  make standalone  Build single HTML file (no server needed)"
	@echo "  make preview     Preview production build (localhost:4173)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean       Remove build artifacts"
	@echo "  make clean-all   Remove build artifacts and node_modules"
	@echo ""
	@echo "Deployment Options:"
	@echo "  1. Standard (make build):"
	@echo "     - Best performance, requires web server"
	@echo "     - Deploy src/dist/* to your server"
	@echo ""
	@echo "  2. Standalone (make standalone):"
	@echo "     - Single HTML file, no server required"
	@echo "     - Open src/dist/vitaldb-viewer.html directly"
	@echo "     - Share via email, USB, etc."
	@echo ""
