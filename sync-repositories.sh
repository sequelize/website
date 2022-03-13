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
git clone -b feature/typedoc --single-branch "$MAIN_REPO_URL" --depth 1 "$DOCS_DIR/v7"

pushd "$DOCS_DIR/v7"
yarn # Install branch deps & build
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
yarn # Install branch deps & build
yarn docs # Generate v6 typedocs
mv esdoc "$API_DIR/v6" # Move compiled api reference
popd

# ======================================
#  Sequelize v3 - v5 (copy static site as-is) - archives
# ======================================

rm -rf .sequelize/archives
git clone "$MAIN_REPO_URL" .sequelize/archives
cd .sequelize/archives

#VERSIONS=("v5" "v4" "v3")
VERSIONS=("v3")

build_branch () {
  VERSION=$1

  git checkout "$VERSION"

  # old versions used npm instead of yarn
  npm install
  npm run docs
  git stash
  rm -rf ../"$VERSION"

  if [ "$VERSION" == "v3" ];then
    mkdocs build --clean
    rm -rf ../../static/"$VERSION"
    mv ./site ../../static/"$VERSION"
  else
    rm -rf ../../static/"$VERSION"
    mv ./esdoc ../../static/"$VERSION"
  fi
}

git clone "$MAIN_REPO_URL"

for version in "${VERSIONS[@]}"; do
    build_branch "$version"
done
