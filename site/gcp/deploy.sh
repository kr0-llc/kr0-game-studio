#!/usr/bin/env bash
# Hosts the kr0 Game Studio site on a public Google Cloud Storage bucket.
# Usage: ./deploy.sh YOUR_GCP_PROJECT_ID [bucket-name]
set -euo pipefail
PROJECT="$1"; BUCKET="${2:-kr0-game-studio-site}"
cd "$(dirname "$0")"
./stage-metr0niks.sh
gcloud config set project "$PROJECT"
gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1 || \
  gcloud storage buckets create "gs://$BUCKET" --location=US --uniform-bucket-level-access
gcloud storage buckets update "gs://$BUCKET" --web-main-page-suffix=index.html
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member=allUsers --role=roles/storage.objectViewer
gcloud storage cp --recursive public/* "gs://$BUCKET/" --cache-control="public,max-age=300"
echo "Live at: https://storage.googleapis.com/$BUCKET/index.html"
