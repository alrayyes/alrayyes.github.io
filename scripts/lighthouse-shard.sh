#!/usr/bin/env bash
# Usage: lighthouse-shard.sh <shard> <shards>
#
# Reads page paths on stdin, one per line, and prints the ones that belong to
# shard <shard> of <shards> (1-based). Round-robin, so every shard gets within
# one page of the same count and the shards between them cover each page
# exactly once. scripts/lighthouse.sh uses it to split the audit across CI
# jobs; scripts/lighthouse-shard.test.ts holds the guarantee.
set -euo pipefail

shard=${1:?usage: lighthouse-shard.sh <shard> <shards>}
shards=${2:?usage: lighthouse-shard.sh <shard> <shards>}

if ! [[ $shard =~ ^[0-9]+$ && $shards =~ ^[0-9]+$ ]] || ((shards < 1 || shard < 1 || shard > shards)); then
  echo "shard must be between 1 and $shards, got $shard of $shards" >&2
  exit 2
fi

awk -v shard="$shard" -v shards="$shards" '(NR - 1) % shards == shard - 1'
