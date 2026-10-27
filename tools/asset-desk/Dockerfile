# kr0 Asset Desk. Built and run by tools/kr0-home; see its README.
FROM python:3.13-slim

WORKDIR /app
COPY asset_desk.py ./
COPY static ./static

# /art/drive is the Drive art folder and /art/repo the repo's art/, both bind
# mounted by kr0-home. Runs as root so it can write the catalog and manifests
# into bind mounts whatever their owner on the host.
ENV PYTHONUNBUFFERED=1
EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD ["python", "asset_desk.py", "--client", "ping"]

# Listens on every interface inside the container only; kr0-home publishes the
# port on the host's 127.0.0.1, and the app refuses requests for other hosts.
ENTRYPOINT ["python", "asset_desk.py", "--host", "0.0.0.0", "--root", "drive=/art/drive", "--root", "repo=/art/repo"]
