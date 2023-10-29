#!/usr/bin/env bash

MAIN_REPO_URL=https://github.com/sequelize/sequelize.git
ROOT_DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
DOCS_DIR="$ROOT_DIR/.sequelize"
API_DIR="$ROOT_DIR/static/api"

set -e

# Ensure API_DIR
mkdir -p "$API_DIR"

# ======================================
#  Sequelize v7 (typedoc + docusaurus)
#  Cloned to its own folder because the documentation can import some of its files at build time
# ======================================

# Clear generated directories
rm -rf "$DOCS_DIR/v7"
rm -rf "$API_DIR/v7"

# Get sources
git clone -b main --single-branch "$MAIN_REPO_URL" --depth 1 "$DOCS_DIR/v7"

pushd "$DOCS_DIR/v7"
yarn # Install branch deps & build
yarn build
yarn docs # Generate v7 typedocs
mv .typedoc-build "$API_DIR/v7" # Move compiled api reference
popd

# ======================================
#  Sequelize v6 (esdoc + docusaurus)
#  Cloned to its own folder because the documentation can import some of its files at build time
# ======================================

# Clear generated directories
rm -rf "$DOCS_DIR/v6"
rm -rf "$API_DIR/v6"

# Get sources
git clone -b v6 --single-branch "$MAIN_REPO_URL" --depth 1 .sequelize/v6

pushd "$DOCS_DIR/v6"
nvm install 16
yarn # Install branch deps & build
yarn docs # Generate v6 typedocs
mv esdoc "$API_DIR/v6" # Move compiled api reference
popd

# ======================================
#  Sequelize v5 and lower
#  The files are living inside the static directory and will just be copied over to the build directory at build time
# ======================================
