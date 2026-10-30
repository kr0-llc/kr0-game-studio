# Copies every Metr0niks prototype and lab into public\metr0niks\ (see stage-metr0niks.sh).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$Repo = Resolve-Path "..\.."; $Out = "public\metr0niks"
Remove-Item -Recurse -Force "$Out\games", "$Out\art" -ErrorAction SilentlyContinue
$paths = "games\metr0niks\prototypes", "games\metr0niks\simulations", "games\metr0niks\research\level-concepts",
         "art\metr0niks\ink-proto", "art\metr0niks\themes", "art\metr0niks\characters\tim-o\items", "art\metr0niks\board"
foreach ($p in $paths) {
  New-Item -ItemType Directory -Force (Split-Path "$Out\$p") | Out-Null
  Copy-Item -Recurse -Force "$Repo\$p" "$Out\$p"
}
New-Item -ItemType Directory -Force $Out | Out-Null
Copy-Item -Force "play.html" "$Out\index.html"
Write-Host "Staged Metr0niks prototypes in $Out"
