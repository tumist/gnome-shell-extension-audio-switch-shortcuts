#!/usr/bin/env bash

# This script is meant to be called by make after the code has been compiled, and prepares
# the dist folder for packing by the gnome-extensions tool.
# Accepts a single argument, the distribution directory.

if [[ $# -eq 0 ]] ; then
    echo 'Expecting distribution directory as argument.'
    exit 1
fi

OUTPUT_DIR=$1

# Get static files
cp -r schemas $OUTPUT_DIR/
cp metadata.json $OUTPUT_DIR/
cp LICENSE $OUTPUT_DIR/

# Move translations, if they exist
TRANSLATE_ARG=""
TRANSLATION_COUNT=$(ls -1 translations/*.po 2>/dev/null | wc -l)
if [ $TRANSLATION_COUNT != 0 ]; then
  TRANSLATE_ARG="--podir=po"
  mkdir -p $OUTPUT_DIR/po
  cp translations/* $OUTPUT_DIR/po/
fi

# Get all .js files that need to be included as extra sources
EXTRA_SOURCE_ARG=""
for f in $(cd $OUTPUT_DIR && ls *.js); do
  if [ "$f" != "extension.js" ] && [ "$f" != "prefs.js" ]; then
    EXTRA_SOURCE_ARG="${EXTRA_SOURCE_ARG} --extra-source=$f"
  fi
done

# Finally, do the actual packing
(cd $OUTPUT_DIR/ && gnome-extensions pack --extra-source=LICENSE $EXTRA_SOURCE_ARG $TRANSLATE_ARG --force)

