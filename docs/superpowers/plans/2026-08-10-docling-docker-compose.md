# Docling Docker Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal `docling/` project that runs Docling Serve (CPU + UI) via Docker Compose on port 5001.

**Architecture:** One Compose service pulls the official `docling-serve-cpu` image, exposes port 5001, and enables the Gradio UI. A short README documents start/stop and a sample convert curl.

**Tech Stack:** Docker Compose, `quay.io/docling-project/docling-serve-cpu:latest`, Docling Serve v1 API

## Global Constraints

- Image: `quay.io/docling-project/docling-serve-cpu:latest` (verbatim)
- Port: host `5001` → container `5001`
- UI: `DOCLING_SERVE_ENABLE_UI=1`
- No custom Dockerfile, no GPU, no Redis/workers, no bind mounts
- Project root for deliverables: `docling/`

## File Structure

| File | Responsibility |
|------|----------------|
| `docling/docker-compose.yml` | Single `docling` service definition |
| `docling/README.md` | How to run, endpoints, sample curl |

---

### Task 1: Docker Compose service + README

**Files:**
- Create: `docling/docker-compose.yml`
- Create: `docling/README.md`

**Interfaces:**
- Consumes: none
- Produces: Compose service `docling` listening on `localhost:5001` with UI at `/ui`

- [ ] **Step 1: Create `docling/docker-compose.yml`**

```yaml
services:
  docling:
    image: quay.io/docling-project/docling-serve-cpu:latest
    ports:
      - "5001:5001"
    environment:
      DOCLING_SERVE_ENABLE_UI: "1"
    restart: unless-stopped
```

- [ ] **Step 2: Create `docling/README.md`**

```markdown
# Docling Serve (Docker Compose)

Runs [Docling Serve](https://github.com/docling-project/docling-serve) locally using the official CPU image, with the Gradio UI enabled.

Based on [Docling](https://github.com/docling-project/docling).

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)

## Start

```bash
docker compose up -d
```

First pull can take several minutes (image is multi-GB).

## Endpoints

| URL | Purpose |
|-----|---------|
| http://localhost:5001/ui | Gradio UI playground |
| http://localhost:5001/docs | OpenAPI docs |
| http://localhost:5001 | API base |

## Sample convert (curl)

```bash
curl -X POST 'http://localhost:5001/v1/convert/source' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "sources": [{"kind": "http", "url": "https://arxiv.org/pdf/2501.17887"}]
  }'
```

## Stop

```bash
docker compose down
```
```

- [ ] **Step 3: Validate Compose file**

Run: `docker compose -f docling/docker-compose.yml config`

Expected: prints a resolved config with service `docling`, image `quay.io/docling-project/docling-serve-cpu:latest`, port mapping `5001:5001`, and env `DOCLING_SERVE_ENABLE_UI=1`. No errors.

- [ ] **Step 4: Start the stack and smoke-check**

Run:

```bash
cd docling
docker compose up -d
```

Wait until the container is healthy/running (first start may download a large image). Then:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/docs
```

Expected: HTTP `200` (or `200`-class success). Optionally open `http://localhost:5001/ui` in a browser.

If the image pull is too slow for the session, leave the stack starting and note that the user should wait for `docker compose ps` to show `running` before using the UI.

- [ ] **Step 5: Commit**

```bash
git add docling/docker-compose.yml docling/README.md docs/superpowers/specs/2026-08-10-docling-docker-compose-design.md docs/superpowers/plans/2026-08-10-docling-docker-compose.md
git commit -m "$(cat <<'EOF'
Add Docling Serve CPU stack via Docker Compose.

EOF
)"
```

Only run the commit if the user explicitly asked to commit; otherwise stop after Step 4 and report the files created.
