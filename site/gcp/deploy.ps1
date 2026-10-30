# Hosts the kr0 Game Studio site on a public Google Cloud Storage bucket.
# Usage (PowerShell, from this folder):  .\deploy.ps1 -Project YOUR_GCP_PROJECT_ID
param(
  [Parameter(Mandatory=$true)][string]$Project,
  [string]$Bucket = "kr0-game-studio-site",
  [string]$Location = "US"
)
$ErrorActionPreference = "Stop"
& "$PSScriptRoot\stage-metr0niks.ps1"
Set-Location $PSScriptRoot
gcloud config set project $Project
$exists = gcloud storage buckets describe "gs://$Bucket" --format="value(name)" 2>$null
if (-not $exists) {
  gcloud storage buckets create "gs://$Bucket" --location=$Location --uniform-bucket-level-access
}
gcloud storage buckets update "gs://$Bucket" --web-main-page-suffix=index.html
gcloud storage buckets add-iam-policy-binding "gs://$Bucket" --member=allUsers --role=roles/storage.objectViewer
gcloud storage cp --recursive "public/*" "gs://$Bucket/" --cache-control="public,max-age=300"
Write-Host ""
Write-Host "Live at: https://storage.googleapis.com/$Bucket/index.html"
