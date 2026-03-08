<div align="center">

# 🧠 DocMind — AI File Intelligence SaaS

### Production-grade multi-tenant AI document platform with RAG, semantic search, smart summarization, Q&A generation, and document comparison.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-docmind.space-blue?style=for-the-badge)](https://docmind.space)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![AWS](https://img.shields.io/badge/AWS-EC2+RDS+S3-FF9900?style=for-the-badge&logo=amazonaws)](https://aws.amazon.com)

**🔗 Live at → [https://docmind.space](https://docmind.space)**

</div>

---

## 📸 Features at a Glance

| Feature | Description |
|---|---|
| 🔐 **Multi-Tenant Auth** | JWT + Refresh tokens, RBAC (owner/admin/member), org isolation |
| 📁 **Smart File Upload** | PDF, DOCX, TXT via AWS S3 with async AI processing pipeline |
| 🔍 **Hybrid Search** | Semantic + keyword search using pgvector cosine similarity |
| 🤖 **Smart Summarizer** | TL;DR, key points, action items, sentiment, difficulty + PDF export |
| ❓ **Q&A Generator** | Auto-generates questions with difficulty filter + PDF export |
| 💬 **Ask AI (RAG Chat)** | Single-document conversational AI with source attribution |
| 🧠 **Knowledge Chat** | Multi-document RAG — query across multiple docs simultaneously |
| ⚖️ **Document Comparison** | AI-powered side-by-side analysis: similarities, differences, insights |
| 📊 **Usage Analytics** | Feature adoption charts, daily queries, most queried documents |
| 🔒 **SSL + Custom Domain** | HTTPS via Let's Encrypt, auto-renewal, Nginx reverse proxy |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     docmind.space (HTTPS)                    │
│                    Nginx Reverse Proxy                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌─────────▼────────┐
│  React 18 SPA  │          │  Express API      │
│  Vite + TW CSS │          │  Node.js 22 ESM   │
│  Zustand store │          │  PM2 cluster mode │
└────────────────┘          └──────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
   ┌──────────▼──────┐  ┌─────────▼──────┐  ┌──────────▼──────┐
   │  PostgreSQL 16  │  │  Redis + BullMQ │  │   AWS S3        │
   │  + pgvector     │  │  Job Queue      │  │  File Storage   │
   │  AWS RDS        │  │  Docker         │  │  ap-south-1     │
   └─────────────────┘  └────────────────┘  └─────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   Worker Service     │
                        │  Text Extraction     │
                        │  Chunking (512 tok)  │
                        │  Embedding (768-dim) │
                        │  Groq LLM API        │
                        └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Usage |
|---|---|
| **Node.js 22** | Runtime with native ESM modules |
| **Express.js** | REST API framework with async error handling |
| **PostgreSQL 16 + pgvector** | Relational DB + vector similarity search |
| **Redis + BullMQ** | Async job queue for AI document processing |
| **AWS S3** | Scalable file storage with presigned URLs |
| **AWS RDS** | Managed PostgreSQL in ap-south-1 |
| **Groq API (llama-3.3-70b)** | LLM for RAG, summarization, Q&A, comparison |
| **JWT + bcrypt** | Stateless auth with refresh token rotation |
| **PM2** | Process management, cluster mode, auto-restart |
| **Nginx** | Reverse proxy, static file serving, SSL termination |

### Frontend
| Technology | Usage |
|---|---|
| **React 18** | UI with hooks and functional components |
| **Vite** | Ultra-fast build tooling |
| **Tailwind CSS** | Utility-first styling with dark mode |
| **Zustand** | Lightweight global state management |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **jsPDF** | Client-side PDF export |
| **Lucide React** | Icon system |

### Infrastructure & DevOps
| Technology | Usage |
|---|---|
| **AWS EC2 (t3.micro)** | Application server — Ubuntu 24.04 |
| **AWS RDS** | Managed PostgreSQL database |
| **AWS S3** | Object storage for uploaded files |
| **Let's Encrypt + Certbot** | Free SSL certificate with auto-renewal |
| **Docker** | Redis containerization |
| **Git + GitHub** | Version control |

---

## 🚀 AI Pipeline

```
User uploads file
       │
       ▼
   AWS S3 Storage
       │
       ▼
  BullMQ Job Queue (Redis)
       │
       ▼
  Worker Service
  ├── Text Extraction (PDF/DOCX/TXT)
  ├── Smart Chunking (512 tokens, 50 overlap)
  ├── Hash-based Embeddings (768 dimensions)
  └── pgvector Storage
       │
       ▼
  Query Time (RAG)
  ├── Embed query → cosine similarity search
  ├── Retrieve top-k chunks
  ├── Build context prompt
  └── Groq llama-3.3-70b → Structured response
```

---

## 📂 Project Structure

```
docmind-saas/
├── apps/
│   ├── api/                    # Express REST API
│   │   ├── app.js              # App entry point
│   │   └── src/
│   │       ├── config/         # DB, Redis, S3, env
│   │       ├── middlewares/    # Auth, rate limiter, logger
│   │       ├── modules/
│   │       │   ├── auth/       # JWT, register, login
│   │       │   ├── files/      # Upload, S3, processing
│   │       │   ├── rag/        # RAG, summarize, Q&A, compare
│   │       │   ├── search/     # Hybrid semantic search
│   │       │   ├── analytics/  # Usage metrics
│   │       │   └── organizations/
│   │       └── utils/          # Logger, helpers
│   ├── web/                    # React 18 SPA
│   │   └── src/
│   │       ├── pages/          # Dashboard, Documents, Chat,
│   │       │                   # Summarize, QA, KnowledgeChat,
│   │       │                   # Compare, Analytics
│   │       ├── components/     # Layout, RateLimitCountdown
│   │       ├── api/            # Axios client modules
│   │       ├── store/          # Zustand auth + theme store
│   │       └── utils/          # PDF export
│   └── worker/                 # BullMQ document processor
│       └── src/
│           ├── processors/     # File processing pipeline
│           └── embedding/      # Vector embedding generator
├── .env                        # Environment variables
├── ecosystem.config.cjs        # PM2 configuration
└── package.json                # Monorepo root
```

---

## ⚡ Getting Started (Local)

### Prerequisites
- Node.js 22+
- PostgreSQL 16 with pgvector extension
- Redis
- AWS account (S3 bucket)
- Groq API key (free at console.groq.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/Roshu09/docmind-saas.git
cd docmind-saas

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in your DB, Redis, AWS, Groq credentials

# Run database migrations
npm run migrate

# Start all services
npm run dev          # API + Worker
cd apps/web && npm run dev   # Frontend
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/docmind

# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your_bucket

# AI
GROQ_API_KEY=your_groq_key

# Auth
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

---

## 🌐 Production Deployment

Deployed on **AWS EC2 (t3.micro)** in **ap-south-1 (Mumbai)**:

```bash
# Process management
pm2 start ecosystem.config.cjs
pm2 list

# Build frontend
cd apps/web
VITE_API_URL=https://docmind.space npm run build

# SSL certificate
sudo certbot --nginx -d docmind.space -d www.docmind.space

# Nginx serves static files + proxies /api → Express
```

---

## 📊 Key Metrics

- **Vector dimensions:** 768 (hash-based deterministic embeddings)
- **Chunk size:** 512 tokens with 50 token overlap
- **LLM:** Groq llama-3.3-70b-versatile
- **Search:** Cosine similarity via pgvector
- **Auth:** JWT (15min) + Refresh token (7 days) rotation
- **File types:** PDF, DOCX, TXT
- **Deployment:** AWS ap-south-1 (Mumbai region)

---

## 🎯 Resume Highlights

> ✅ Built and deployed **production multi-tenant AI SaaS** at [docmind.space](https://docmind.space) on AWS EC2  
> ✅ Implemented **RAG pipeline** with pgvector cosine similarity search and Groq LLM (llama-3.3-70b)  
> ✅ Designed **async document processing** with BullMQ job queue and Redis  
> ✅ Built **multi-document Knowledge Chat** with per-doc source attribution  
> ✅ Implemented **JWT auth with refresh token rotation** and multi-tenant RBAC  
> ✅ Configured **SSL/TLS** with Let's Encrypt + Nginx reverse proxy on custom domain  
> ✅ Built **Usage Analytics Dashboard** with feature adoption metrics and query tracking  
> ✅ Created **AI Document Comparison** — similarities, differences, insights across any 2 docs  

---

## 👨‍💻 Author

<div align="center">

**Roshan Kumar**  
MCA Student | Full Stack Developer | AI/ML Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-Roshu09-181717?style=for-the-badge&logo=github)](https://github.com/Roshu09)

*Built with ❤️ as a production-grade portfolio project demonstrating MERN, Cloud, DevOps & AI/RAG skills*

</div>

---

## 📄 License

MIT License — feel free to use this project for learning and portfolio purposes.

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

[🌐 Live Demo](https://docmind.space) • [🐛 Report Bug](https://github.com/Roshu09/docmind-saas/issues) • [💡 Request Feature](https://github.com/Roshu09/docmind-saas/issues)

</div>