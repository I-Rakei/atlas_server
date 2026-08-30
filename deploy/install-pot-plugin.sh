#!/usr/bin/env bash
# Installs the bgutil-ytdlp-pot-provider yt-dlp plugin for a standalone/frozen
# yt-dlp binary (the youtube-dl-exec npm package downloads one of these, so
# `pip install bgutil-ytdlp-pot-provider` alone won't be picked up).
# Run this as the same user that runs the Atlas server, so $HOME matches.
set -euo pipefail

VERSION="1.3.2"
PLUGIN_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/yt-dlp/plugins"
URL="https://github.com/Brainicism/bgutil-ytdlp-pot-provider/releases/download/${VERSION}/bgutil-ytdlp-pot-provider.zip"

mkdir -p "$PLUGIN_DIR"
curl -fsSL "$URL" -o "$PLUGIN_DIR/bgutil-ytdlp-pot-provider.zip"

echo "Installed plugin to $PLUGIN_DIR/bgutil-ytdlp-pot-provider.zip"
echo "Verify with: yt-dlp -v https://www.youtube.com/watch?v=dQw4w9WgXcQ 2>&1 | grep -i bgutil"
echo "(should list the bgutil HTTP PO Token Provider; make sure the bgutil-pot-provider service is running first)"
