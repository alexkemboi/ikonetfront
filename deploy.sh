#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# deploy.sh – Pull a pre-built image from GHCR, recreate the
#             container, and verify it comes up healthy.
#
# Usage:    IMAGE_TAG=<sha> GHCR_ACTOR=<user> GHCR_TOKEN=<pat> \
#           ./deploy.sh [sha]
#
# The optional [sha] argument takes precedence over the env var
# so the GitHub Actions workflow can pass it positionally.
# ─────────────────────────────────────────────────────────────

IMAGE_TAG="${1:-${IMAGE_TAG:-latest}}"
GHCR_REGISTRY="ghcr.io"
REPO_NAME="${REPO_NAME:-nicanornicolas/internet-billing-systemf}"
FULL_IMAGE="${GHCR_REGISTRY}/${REPO_NAME}:${IMAGE_TAG}"

echo "==> Deploying image: ${FULL_IMAGE}"
cd ~/internet-billing-systemf/

# ── 1. Authenticate with GHCR ────────────────────────────────
if [[ -n "${GHCR_TOKEN:-}" && -n "${GHCR_ACTOR:-}" ]]; then
  echo "${GHCR_TOKEN}" | docker login "${GHCR_REGISTRY}" \
    -u "${GHCR_ACTOR}" --password-stdin
fi

# ── 2. Pull the exact image ──────────────────────────────────
docker pull "${FULL_IMAGE}"

# ── 3. Export image tag for docker compose ───────────────────
export IMAGE_TAG

# ── 4/5. Replace the container in one step ───────────────────
# No separate `down`: the old container keeps serving until compose swaps it
# for the new image, keeping the window where nginx has no upstream short.
docker compose up -d --force-recreate --remove-orphans --timeout 20

# ── 6. Verify the app is accepting connections ───────────────
PORT="${FRONTEND_PORT:-3456}"
echo "==> Waiting for app on port ${PORT} ..."
for i in $(seq 1 12); do
  if curl -sf "http://localhost:${PORT}" > /dev/null 2>&1; then
    echo "==> App is healthy after ${i}s"
    exit 0
  fi
  sleep 5
done

echo "ERROR: App did NOT become healthy within 60s."
echo "Check logs with: docker compose logs --tail=50"
exit 1