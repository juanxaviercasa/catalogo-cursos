#!/usr/bin/env bash
set -euo pipefail

: "${VIDEO_PROCESSOR_PORT:?Define VIDEO_PROCESSOR_PORT antes de iniciar el trabajador local.}"
: "${VIDEO_PROCESSOR_SHARED_SECRET:?Define VIDEO_PROCESSOR_SHARED_SECRET antes de iniciar el trabajador local.}"
: "${DATABASE_URL:?Define DATABASE_URL para que el trabajador actualice los estados.}"
: "${BUILT_IN_FORGE_API_URL:?Define BUILT_IN_FORGE_API_URL para subir los MP4.}"
: "${BUILT_IN_FORGE_API_KEY:?Define BUILT_IN_FORGE_API_KEY para subir los MP4.}"

export VIDEO_PROCESSOR_MODE=local-worker
export PORT="$VIDEO_PROCESSOR_PORT"
exec pnpm processor:service
