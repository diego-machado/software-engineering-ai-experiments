# Aero Search

Aplicação full-stack para busca de voos entre FLN, CGH e GRU.

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Como rodar

### 1. Subir o banco de dados

```bash
docker compose up -d
```

O PostgreSQL 18.4 sobe na porta `5432` e executa automaticamente os scripts em `db/init/` para criar o schema e popular os dados (01/06/2026 a 12/06/2026).

### 2. Backend

```bash
cd backend
cp .env.example .env   # se ainda não existir
npm install
npm run dev
```

API disponível em `http://localhost:3002` (configurável via `PORT` no `.env`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Interface disponível em `http://localhost:5173`.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status da API e conexão com o banco |
| GET | `/api/flights/search?origin=FLN&destination=CGH&date=2026-06-05` | Busca voos de ida e volta |

## Estrutura do backend

```
backend/src/
├── mcp/          # Servidor MCP (Streamable HTTP)
├── db/           # Conexão pg-promise
├── data/         # Acesso ao banco (repository)
├── services/     # Regras de negócio
├── routes/       # Rotas HTTP
└── types/        # Tipos TypeScript
```

## MCP (Model Context Protocol)

Servidor MCP em `backend/src/mcp/` conectado à camada de **services**, exposto via **Streamable HTTP**. Requer PostgreSQL rodando (`docker compose up -d`).

### Tools disponíveis

| Tool | Descrição |
|------|-----------|
| `get_search_conditions` | Aeroportos, rotas, datas e regras de preço |
| `search_flights` | Busca ida/volta entre dois aeroportos |
| `find_best_day_trip` | Melhor combinação FLN ↔ SP no mesmo dia com janela de reunião |

### Prompt

| Prompt | Descrição |
|--------|-----------|
| `day_trip_to_sao_paulo` | Template para viagem ida/volta com horário de reunião |

### Rodar o MCP

```bash
cd backend
npm run mcp
```

Endpoint: `http://127.0.0.1:3003/mcp` (configurável via `MCP_PORT` e `MCP_HOST` no `.env`).

### Configurar no Cursor

Adicione em `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "aero-search": {
      "url": "http://127.0.0.1:3003/mcp"
    }
  }
}
```

### Exemplo de uso

> Quero ir e voltar de FLN para São Paulo no dia 2026-06-05. Reunião das 10h às 17h. Quero o mais barato (CGH ou GRU).

O agente deve chamar `find_best_day_trip` com `date=2026-06-05`, `meetingStart=10:00`, `meetingEnd=17:00`.

## Dados

- **Aeroportos:** FLN, CGH, GRU
- **Rotas:** ida e volta entre FLN ↔ CGH e FLN ↔ GRU
- **Período:** 01/06/2026 a 12/06/2026
- **Voos:** 16 por dia (4 por rota)
- **Preços:** mais baratos entre 10h–16h; CGH sempre mais caro que GRU no mesmo horário
