#!/usr/bin/env bash

MAIN_REPO_URL=git@github.com:sequelize/sequelize.git

set -e

# ======================================
#  Sequelize v7 (typedoc + docusaurus)
#  Cloned to its own folder because the documentation can import some of its files at build time
# ======================================

# download v7 branch
rm -rf .sequelize/v7
rm -rf ../../static/api/v7

git clone -b feature/typedoc --single-branch "$MAIN_REPO_URL" --depth 1 .sequelize/v7
cd .sequelize/v7

# install branch deps & build
yarn

# generate v7 typedocs
yarn docs

mv .typedoc-build ../../static/api/v7

cd ../..

# ======================================
#  Sequelize v6 (esdoc + docusaurus)
#  Cloned to its own folder because the documentation can import some of its files at build time
# ======================================

# download v6 branch
rm -rf .sequelize/v6
rm -rf ../../static/api/v6
git clone -b v6 --single-branch "$MAIN_REPO_URL" --depth 1 .sequelize/v6
cd .sequelize/v6

# install branch deps & build
yarn

# generate v6 legacy esdoc
yarn docs

mv esdoc ../../static/api/v6

cd ../..

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
