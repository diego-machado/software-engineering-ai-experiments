# Docling Docker Compose — Design

## Goal

Run [Docling Serve](https://github.com/docling-project/docling-serve) (API + Gradio UI) locally via Docker Compose under `docling/`, using the official CPU image suitable for macOS.

## Decisions

| Choice | Value |
|--------|--------|
| Runtime | Docling Serve (HTTP API + UI), not CLI-only container |
| Image | `quay.io/docling-project/docling-serve-cpu:latest` |
| UI | Enabled (`DOCLING_SERVE_ENABLE_UI=1`) |
| Approach | Minimal official image — no custom Dockerfile, no GPU, no Redis/workers |

## Architecture

Single Compose service:

- Service name: `docling`
- Image: `quay.io/docling-project/docling-serve-cpu:latest`
- Ports: host `5001` → container `5001`
- Environment: `DOCLING_SERVE_ENABLE_UI=1`
- Restart: `unless-stopped`

Endpoints after `docker compose up -d`:

- API: `http://localhost:5001`
- OpenAPI docs: `http://localhost:5001/docs`
- UI playground: `http://localhost:5001/ui`

## Project layout

```
docling/
  docker-compose.yml
  README.md
```

No custom Dockerfile. No bind mounts for input/output (YAGNI). No `.gitignore` unless something later needs ignoring.

## Usage

```bash
cd docling
docker compose up -d
docker compose down
```

README includes a sample `curl` against `POST /v1/convert/source` (URL source), matching [docling-serve](https://github.com/docling-project/docling-serve) quickstart.

## Out of scope

- NVIDIA/AMD GPU compose profiles
- RQ/Redis distributed engine
- Building images from Docling source
- App code that calls the API (this project only runs the service)

## Success criteria

- `docker compose up -d` starts Docling Serve on port 5001
- UI loads at `/ui`
- A convert request via UI or curl succeeds against a public PDF URL
