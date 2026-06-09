#!/usr/bin/env bash
set -euo pipefail

bun install
bun run new demo-notebook || true
bun run dev
