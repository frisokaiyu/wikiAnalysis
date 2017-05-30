#!/bin/bash
DIR="$(pwd)"

for file in ./revisions/*.json
do
    mongoimport --jsonArray --db wikiAnalysis --collection revisions --file "${DIR}${file:1}"
done
