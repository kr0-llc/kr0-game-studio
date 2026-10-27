# kr0-home: start and look after the studio's local services (Docker).
# Windows PowerShell 5.1 or PowerShell 7. Same commands as the bash kr0-home.
# Run: .\kr0-home.ps1 help   (or kr0-home help, through kr0-home.cmd)
param(
    [Parameter(Position = 0)][string]$Command = "help",
    [Parameter(Position = 1, ValueFromRemainingArguments = $true)][string[]]$Rest
)
$ErrorActionPreference = "Stop"

$HomeDir = $PSScriptRoot
$EnvFile = Join-Path $HomeDir ".env"
$Service = "asset-desk"

function Invoke-Compose {
    & docker compose --project-directory $HomeDir -f (Join-Path $HomeDir "compose.yaml") @args
    if ($LASTEXITCODE -ne 0) { throw "docker compose $($args -join ' ') failed" }
}

function Get-Setting([string]$Name, [string]$Default = "") {
    if (-not (Test-Path $EnvFile)) { return $Default }
    $line = Get-Content $EnvFile | Where-Object { $_ -match "^$Name=" } | Select-Object -Last 1
    if (-not $line) { return $Default }
    $value = $line.Substring($Name.Length + 1).Trim('"')
    if ($value) { return $value } else { return $Default }
}

function Get-Url { "http://127.0.0.1:$(Get-Setting 'KR0_ASSET_DESK_PORT' '8765')" }

function Assert-Settings {
    if (-not (Test-Path $EnvFile)) { throw "No settings yet. Run: kr0-home init" }
}

function Invoke-Client([string]$Action, [switch]$Quiet) {
    # Out-Host keeps the service's output on screen and out of the return value.
    if ($Quiet) {
        & docker compose --project-directory $HomeDir -f (Join-Path $HomeDir "compose.yaml") exec -T $Service python asset_desk.py --client $Action *> $null
    } else {
        & docker compose --project-directory $HomeDir -f (Join-Path $HomeDir "compose.yaml") exec -T $Service python asset_desk.py --client $Action | Out-Host
    }
    return $LASTEXITCODE
}

function Wait-Healthy {
    for ($i = 0; $i -lt 30; $i++) {
        if ((Invoke-Client ping -Quiet) -eq 0) { return }
        Start-Sleep -Seconds 1
    }
    throw "Asset Desk didn't come up. See: kr0-home logs"
}

function Invoke-Init {
    if (Test-Path $EnvFile) { Write-Host "Settings already exist: $EnvFile"; return }
    $lines = Get-Content (Join-Path $HomeDir ".env.example")
    $drive = Read-Host "Drive art folder [$(($lines | Where-Object { $_ -match '^KR0_DRIVE_ART=' }) -replace '^KR0_DRIVE_ART=', '')]"
    $key = Read-Host "Scenario API key (Enter to skip)"
    $secret = ""
    if ($key) {
        $secure = Read-Host "Scenario API secret" -AsSecureString
        $secret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    }
    $lines = $lines | ForEach-Object {
        if ($drive -and $_ -match '^KR0_DRIVE_ART=') { "KR0_DRIVE_ART=$drive" }
        elseif ($key -and $_ -match '^SCENARIO_API_KEY=') { "SCENARIO_API_KEY=$key" }
        elseif ($secret -and $_ -match '^SCENARIO_API_SECRET=') { "SCENARIO_API_SECRET=$secret" }
        else { $_ }
    }
    # UTF-8 without a byte-order mark, which docker compose can't read.
    [IO.File]::WriteAllLines($EnvFile, [string[]]$lines)
    Write-Host "Saved $EnvFile. Next: kr0-home up"
}

function Invoke-Up([string]$Flag) {
    Assert-Settings
    $drive = Get-Setting "KR0_DRIVE_ART"
    if (-not (Test-Path -LiteralPath $drive)) {
        throw "Drive folder not found: $drive. Is Google Drive for Desktop running? Fix KR0_DRIVE_ART in $EnvFile"
    }
    Invoke-Compose up -d --build $Service
    Wait-Healthy
    Write-Host "Asset Desk is running at $(Get-Url)"
    if ((Invoke-Client scan -Quiet) -eq 0) { Write-Host "Scanned the folders." }
    if ($Flag -ne "--no-open") { Start-Process (Get-Url) }
}

function Invoke-Doctor {
    $script:ok = $true
    function Check([string]$Name, [scriptblock]$Test, [string]$Fix = "") {
        $passed = $false
        try { $passed = [bool](& $Test) } catch { $passed = $false }
        if ($passed) { Write-Host "  ok    $Name" }
        else { Write-Host "  FAIL  $Name$(if ($Fix) { ": $Fix" })" -ForegroundColor Red; $script:ok = $false }
    }
    Write-Host "kr0-home doctor"
    Check "Docker installed" { Get-Command docker -ErrorAction SilentlyContinue } "install Docker Desktop"
    Check "Docker running" { & docker info *> $null; $LASTEXITCODE -eq 0 } "start Docker Desktop"
    Check "Docker Compose v2" { & docker compose version *> $null; $LASTEXITCODE -eq 0 }
    Check "Settings file" { Test-Path $EnvFile } "run kr0-home init"
    if (Test-Path $EnvFile) {
        $drive = Get-Setting "KR0_DRIVE_ART"
        Check "Drive folder exists ($drive)" { $drive -and (Test-Path -LiteralPath $drive) } "is Google Drive for Desktop running?"
        Check "Scenario key set" { Get-Setting "SCENARIO_API_KEY" } "Sync Scenario will fail without it"
    }
    $running = & docker compose --project-directory $HomeDir -f (Join-Path $HomeDir "compose.yaml") ps --status running -q $Service 2>$null
    if ($running) {
        Check "Asset Desk answering at $(Get-Url)" { (Invoke-Client ping -Quiet) -eq 0 }
        $json = & docker compose --project-directory $HomeDir -f (Join-Path $HomeDir "compose.yaml") exec -T $Service python asset_desk.py --client folders 2>$null
        $seen = 0
        try { $seen = ($json | Out-String | ConvertFrom-Json).drive.mediaFiles } catch { }
        Check "Drive folder visible inside the container ($seen files)" { $seen -gt 0 } "Docker can't see the folder; see README, 'If the container sees an empty Drive folder'"
    } else {
        Write-Host "  --    Asset Desk not running (kr0-home up)"
    }
    if ($script:ok) { Write-Host "All good." } else { exit 1 }
}

function Show-Usage {
    @"
kr0-home: the studio's local services, in Docker.

  kr0-home init              create settings (.env): Drive folder, Scenario key
  kr0-home up [--no-open]    build and start Asset Desk, scan, open the browser
  kr0-home down              stop it
  kr0-home restart           restart it
  kr0-home status            what's running, folders, asset and grade counts
  kr0-home open              open Asset Desk in the browser
  kr0-home logs [-f]         show the service log
  kr0-home scan              re-read the art folders
  kr0-home sync              pull the Scenario library
  kr0-home manifest <game>   write art/<game>/manifest.jsonl from approved assets
  kr0-home doctor            check Docker, settings and the Drive folder
  kr0-home build             rebuild the image from the repo
"@
}

switch ($Command) {
    "init" { Invoke-Init }
    "up" { Invoke-Up ($Rest | Select-Object -First 1) }
    "down" { Invoke-Compose down }
    "restart" { Assert-Settings; Invoke-Compose restart $Service }
    "status" { Assert-Settings; Invoke-Compose ps; $null = Invoke-Client status }
    "open" { Start-Process (Get-Url) }
    "logs" { Invoke-Compose logs @Rest $Service }
    "scan" { exit (Invoke-Client scan) }
    "sync" { exit (Invoke-Client sync) }
    "manifest" {
        if (-not $Rest) { throw "Usage: kr0-home manifest <game>" }
        exit (Invoke-Client "manifest:$($Rest[0])")
    }
    "doctor" { Invoke-Doctor }
    "build" { Assert-Settings; Invoke-Compose build --pull $Service }
    { $_ -in "help", "-h", "--help" } { Show-Usage }
    default { Write-Host "Unknown command: $Command"; Show-Usage; exit 2 }
}
