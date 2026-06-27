#!/usr/bin/env bash

# Exit immediately if any command exits with a non-zero status
set -e

# Define absolute paths
WORKSPACE_ROOT="/home/harshit/coding/agent-office"
DOCX_EDITOR_DIR="$WORKSPACE_ROOT/causualdocx/docx-editor"
EXTENSION_DIR="$DOCX_EDITOR_DIR/apps/vscode-ext"
WEBVIEW_DIR="$EXTENSION_DIR/webview"
VSCODE_DIR="$WORKSPACE_ROOT/vscode"

# Export environment variable to skip Node version check globally for this run
export VSCODE_SKIP_NODE_VERSION_CHECK=1

# Helper functions for colored logging
log() {
  echo -e "\x1B[1;34m[start-dev] $1\x1B[0m"
}

log_success() {
  echo -e "\x1B[1;32m[start-dev] $1\x1B[0m"
}

# Parse options: extract --build/-b, pass everything else to Code-OSS
FORCE_BUILD=false
PASS_ARGS=()

for arg in "$@"; do
  if [[ "$arg" == "--build" || "$arg" == "-b" ]]; then
    FORCE_BUILD=true
  else
    PASS_ARGS+=("$arg")
  fi
done

# 1. Build causualdocx/docx-editor if node_modules is missing or force build is active
if [ ! -d "$DOCX_EDITOR_DIR/node_modules" ] || [ "$FORCE_BUILD" = true ]; then
  log "Building docx-editor monorepo packages..."
  cd "$DOCX_EDITOR_DIR"
  bun install
  bun run build
  log_success "docx-editor monorepo built successfully."
fi

# 2. Build vscode-ext webview if node_modules is missing or force build is active
if [ ! -d "$WEBVIEW_DIR/node_modules" ] || [ ! -d "$WEBVIEW_DIR/dist" ] || [ "$FORCE_BUILD" = true ]; then
  log "Building extension webview..."
  cd "$WEBVIEW_DIR"
  npm install
  npm run build
  log_success "Webview built successfully."
fi

# 3. Build vscode-ext if node_modules/out is missing or force build is active
if [ ! -d "$EXTENSION_DIR/node_modules" ] || [ ! -d "$EXTENSION_DIR/out" ] || [ "$FORCE_BUILD" = true ]; then
  log "Compiling VS Code extension..."
  cd "$EXTENSION_DIR"
  npm install
  npm run compile
  log_success "Extension compiled successfully."
fi

# 4. Build vscode dependencies if node_modules is missing or force build is active
if [ ! -d "$VSCODE_DIR/node_modules" ] || [ "$FORCE_BUILD" = true ]; then
  log "Installing VS Code dependencies (bypassing Node version check)..."
  cd "$VSCODE_DIR"
  npm install
  log_success "VS Code dependencies installed."
fi

# 5. Compile VS Code built-in extensions if out/ is missing or force build is active
if [ ! -d "$VSCODE_DIR/out" ] || [ "$FORCE_BUILD" = true ]; then
  log "Compiling VS Code built-in extensions and client..."
  cd "$VSCODE_DIR"
  npm run compile
  log_success "VS Code compiled successfully."
fi

# 6. Launch VS Code Development Host
log "Launching Code-OSS Development Host with DOCX Editor extension..."
cd "$VSCODE_DIR"
./scripts/code.sh --extensionDevelopmentPath="$EXTENSION_DIR" "${PASS_ARGS[@]}"
