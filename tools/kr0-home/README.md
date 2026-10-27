# kr0-home

Last updated: 27 October 2026 · Owner: tools-programmer, for kr0's review

`kr0-home` runs the studio's local services on kr0's machine in Docker, with one command line for starting, checking and stopping them. Today it runs one service, [Asset Desk](../asset-desk/README.md). New local services get a block in `compose.yaml` and a few lines in the CLI.

| File | What it is |
| --- | --- |
| `kr0-home.ps1`, `kr0-home.cmd` | The CLI for Windows (PowerShell 5.1 or 7; the `.cmd` lets you type `kr0-home` in any terminal) |
| `kr0-home` | The same CLI for bash (macOS, Linux, WSL, Git Bash) |
| `compose.yaml` | The services and what each one mounts |
| `.env.example` | Settings template. `kr0-home init` copies it to `.env`, which stays on your machine and is never committed |

## Set up (Windows, once)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it.
2. Add `tools\kr0-home` in your repo clone to your PATH (Settings, System, About, Advanced system settings, Environment Variables, Path), or `cd` into it each time.
3. Run `kr0-home init`. It asks for the Drive art folder (`G:\My Drive\kr0 Studio Art`) and your Scenario API key and secret, and saves them to `tools\kr0-home\.env`.
4. Run `kr0-home up`. It builds the container, starts it, scans the folders and opens http://127.0.0.1:8765.
5. Run `kr0-home doctor` if anything looks wrong.

## Commands

| Command | Does |
| --- | --- |
| `kr0-home init` | Create the settings file |
| `kr0-home up [--no-open]` | Build and start Asset Desk, scan the folders, open the browser |
| `kr0-home down` / `restart` | Stop or restart it |
| `kr0-home status` | Container state, folders, asset and grade counts |
| `kr0-home open` | Open Asset Desk in the browser |
| `kr0-home logs [-f]` | The service log |
| `kr0-home scan` / `sync` | Re-read the folders / pull the Scenario library |
| `kr0-home manifest <game>` | Write `art/<game>/manifest.jsonl` from approved assets |
| `kr0-home doctor` | Check Docker, the settings, the Drive folder and whether the container can see it |
| `kr0-home build` | Rebuild the image, for example after pulling new code |

The container restarts with Docker Desktop, so after the first `up` Asset Desk is there whenever Docker is running.

## What the container can reach

- The Drive art folder, mounted at `/art/drive`. The catalog (`_catalog/`) is written there.
- This repo's `art/` folder, mounted at `/art/repo`. Manifests are written there; commit them on a branch as usual.
- The Scenario API, with the key from `.env`.
- Port 8765 on your own machine only (`127.0.0.1`). Nothing on your network can reach it.

## If the container sees an empty Drive folder

`kr0-home doctor` checks this ("Drive folder visible inside the container"). Google Drive for Desktop's `G:` drive is a virtual drive, and Docker Desktop can't always mount it. This hasn't been tried on your machine yet. If the check fails:

1. In Drive for Desktop, open Settings, Google Drive, and change **Streaming files** to **Mirror files**, with the mirror folder on a real disk, for example `F:\Drive Mirror`. Drive then keeps a full copy of My Drive there, and still syncs both ways.
2. Set `KR0_DRIVE_ART=F:\Drive Mirror\My Drive\kr0 Studio Art` in `.env` (the path Drive shows).
3. `kr0-home down`, then `kr0-home up`.

Mirroring keeps every file on disk, so it needs room for the whole of My Drive. The other way round it is to run Asset Desk without Docker, with `tools\asset-desk\start-asset-desk.bat`.

## Windows script policy

If PowerShell says running scripts is disabled, allow local scripts for your own user once, in PowerShell:

```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
Unblock-File .\kr0-home.ps1
```

That's your call: it lets any script you saved yourself run, and still requires a signature on scripts downloaded from the internet.

## Tested

The bash CLI was run end to end in a Linux cloud session with Docker 29: `init` settings, `up` (build, health check, scan), `status`, `doctor`, `scan`, `manifest` and `down`, plus the app in a browser through the published port. The PowerShell CLI follows the same steps but hasn't been run yet. Neither has been tried against the real `G:` drive.
