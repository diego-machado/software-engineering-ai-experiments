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

| URL                        | Purpose              |
| -------------------------- | -------------------- |
| http://localhost:5001/ui   | Gradio UI playground |
| http://localhost:5001/docs | OpenAPI docs         |
| http://localhost:5001      | API base             |

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

curl -X POST 'http://localhost:5001/v1/convert/file' \
 -F 'files=@checkbox.pdf;type=application/pdf' \
 -F 'to_formats=md' \
 -F 'do_ocr=true' \
 -F 'force_ocr=true' \
 | jq -r '.document.md_content' > checkbox.md

curl -X POST 'http://localhost:5001/v1/convert/file' \
 -F 'files=@checkbox2.png;type=image/png' \
 -F 'to_formats=md' \
 -F 'do_ocr=true' \
 -F 'force_ocr=true' \
 | jq -r '.document.md_content' > checkbox2.md
