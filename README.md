# 🧠 AI File Intelligence System

> A production-grade, multi-tenant SaaS platform that enables organizations to upload, process, search, and interact with their documents using AI-powered semantic search and RAG.

[![CI](https://github.com/yourusername/ai-file-intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/ai-file-intelligence/actions)
![Node.js](https://img.shields.io/badge/Node.js-22-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-blue)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue)
![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS%20%7C%20S3-orange)

---

## 🏗️ Architecture

```
Client (React)
    │
    ▼
Nginx (reverse proxy + SSL)
    │
    ▼
Express API (Node.js)  ──── Redis (cache + queue) ──── Worker Service
    │                                                        │
    ▼                                                        ▼
PostgreSQL + pgvector ◄─────────────────────────── Embed Jobs (OpenAI)
    │
    ▼
AWS S3 (file storage)
```

## ✨ Features

- **Multi-tenant** — Organization-based isolation with Row-Level Security
- **RBAC** — Owner / Admin / Member roles per organization  
- **File Upload** — PDF, DOCX, TXT via AWS S3 pre-signed URLs
- **Semantic Search** — pgvector cosine similarity + full-text hybrid search
- **RAG Q&A** — GPT-4o with source citations and streaming responses
- **Real-time** — WebSocket notifications for processing status
- **Analytics** — Document stats, search patterns, cost tracking

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Zustand, TanStack Query |
| Backend | Node.js 22, Express, JWT Auth |
| Database | PostgreSQL 16 + pgvector extension |
| Cache/Queue | Redis 7 + BullMQ |
| Storage | AWS S3 (pre-signed URLs) |
| AI/ML | OpenAI text-embedding-3-small + GPT-4o |
| DevOps | Docker, GitHub Actions, AWS EC2/RDS |

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker Desktop running
- Node.js 18+
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/ai-file-intelligence.git
cd ai-file-intelligence

# Copy environment variables
cp .env.example .env
# Edit .env with your values (AWS keys, OpenAI key)
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL (with pgvector), Redis, pgAdmin, Redis Commander
npm run docker:up

# Verify everything is running
docker ps
```

| Service | URL | Credentials |
|---------|-----|-------------|
| pgAdmin | http://localhost:5050 | admin@localhost.com / admin123 |
| Redis Commander | http://localhost:8081 | - |

### 3. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 4. Run Database Migrations

```bash
npm run migrate:up
```

### 5. Start All Services

```bash
# Terminal 1: API server
npm run dev:api

# Terminal 2: Worker service  
npm run dev:worker

# Terminal 3: React frontend
npm run dev:web
```

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Health Check | http://localhost:3000/health |
| Frontend | http://localhost:5173 |

---

## 📁 Project Structure

```
ai-file-intelligence/
├── apps/
│   ├── api/          # Express.js REST API
│   ├── worker/       # BullMQ background worker
│   └── web/          # React frontend
├── infra/
│   ├── docker/       # docker-compose + init scripts
│   ├── nginx/        # Reverse proxy config
│   └── scripts/      # Deploy scripts
├── .github/
│   └── workflows/    # CI/CD pipelines
└── docs/             # Architecture & API docs
```

## 🔧 Environment Variables

See [.env.example](.env.example) for all required variables with descriptions.

## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| POST | /api/files/upload-url | Get S3 pre-signed URL |
| GET | /api/search?q=... | Semantic search |
| POST | /api/rag/query | RAG question answering |

## 📊 Performance

> Load tested with k6 — results to be added after Phase 6

## 🚢 Deployment

See [docs/deployment.md](docs/deployment.md) for AWS deployment guide.

## 🔒 Security

- JWT RS256 authentication
- Row-Level Security (PostgreSQL)
- S3 SSE encryption  
- Rate limiting per organization
- Helmet.js security headers

## 📝 License

MIT
