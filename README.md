# 🧠 AI Doc Intelligence System

> Production-grade multi-tenant AI SaaS for document intelligence — semantic search, summarization, Q&A generation, multi-document chat, and comparison.

**Live Demo:** [https://docmind.space](https://docmind.space) · **Built by:** [Roshan Kumar](https://www.linkedin.com/in/roshan-gupta-340887227/)

![Node.js](https://img.shields.io/badge/Node.js-22-green) ![React](https://img.shields.io/badge/React-18-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-blue) ![AWS](https://img.shields.io/badge/AWS-EC2+S3-orange) ![Tests](https://img.shields.io/badge/Tests-29%20passing-brightgreen) ![SSL](https://img.shields.io/badge/SSL-Let's%20Encrypt-green)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Semantic Search** | Natural language search using 768-dim pgvector embeddings |
| 🤖 **Smart Summarizer** | TL;DR, key points, action items, sentiment, difficulty score |
| ❓ **Q&A Generator** | Auto-generate questions by difficulty, export as PDF |
| 💬 **Knowledge Chat** | Multi-document RAG chat with source attribution |
| ⚖️ **Document Comparison** | AI-powered similarities, differences, insights |
| 📊 **Usage Analytics** | Feature adoption, daily queries, top documents |
| 🔑 **API Key Management** | Generate keys with scopes, expiry, revoke/delete |
| 🔐 **Email OTP Verification** | Nodemailer + Gmail SMTP with 6-digit OTP |
| 🔑 **Google OAuth 2.0** | One-click login with auto workspace creation |
| 👤 **User Profile Popup** | Stats, role, org details, last login |
| 🌐 **Public Landing Page** | Dark theme, particles, navbar, animations |

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────┐
│     React 18 SPA · Vite · Tailwind      │  ← Frontend
└──────────────────┬──────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────┐
│   Nginx Reverse Proxy · SSL/TLS         │  ← Proxy
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  Express API · Node.js 22 · PM2 · JWT   │  ← Backend
│  Passport.js · Google OAuth · Nodemailer│
└──────┬───────────┬───────────┬──────────┘
       │           │           │
┌──────▼──┐  ┌─────▼────┐  ┌──▼──────┐
│Postgres │  │  Redis   │  │  AWS S3 │
│+pgvector│  │+ BullMQ  │  │  Files  │
└─────────┘  └──────────┘  └─────────┘
                   │
┌──────────────────▼──────────────────────┐
│  Worker · Chunk → Embed → Index         │  ← AI Pipeline
│  Groq llama-3.3-70b · 768-dim vectors   │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, React Query |
| **Backend** | Node.js 22 (ESM), Express, Passport.js, JWT |
| **Database** | PostgreSQL 16 + pgvector (cosine similarity) |
| **Cache/Queue** | Redis + BullMQ (async document processing) |
| **AI/LLM** | Groq llama-3.3-70b-versatile |
| **Storage** | AWS S3 (multi-tenant file isolation) |
| **Infrastructure** | AWS EC2 t3.micro, Nginx, PM2, Let's Encrypt |
| **Auth** | JWT + Refresh Tokens, Google OAuth 2.0, Email OTP |
| **Testing** | Vitest + Supertest (29 tests) |
| **CI/CD** | GitHub Actions (auto-deploy on push to main) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 16 with pgvector extension
- Redis
- AWS S3 bucket
- Groq API key

### Installation
```bash
git clone https://github.com/Roshu09/docmind-saas.git
cd docmind-saas
npm install
cp .env.example .env  # fill in your values
npm run dev
```

### Environment Variables
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=aifi_production
DB_USER=aifi_user
DB_PASSWORD=your-password
REDIS_HOST=127.0.0.1
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=your-bucket
GROQ_API_KEY=your-groq-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
EMAIL_SMTP_USER=your@gmail.com
EMAIL_SMTP_PASS=your-app-password
```

### Run Tests
```bash
npm test              # run all 29 tests
npm run test:coverage # with coverage report
```

---

## 📡 API Reference

### Authentication
```
POST /api/auth/register    - Create account + workspace
POST /api/auth/login       - Login with email/password
GET  /api/auth/google      - Google OAuth login
POST /api/auth/send-otp    - Send email OTP
POST /api/auth/verify-otp  - Verify email OTP
```

### Documents
```
POST /api/files/upload     - Upload document (PDF/DOCX/TXT)
GET  /api/files            - List documents
DELETE /api/files/:id      - Delete document
```

### AI Features
```
POST /api/rag/query        - Semantic search
POST /api/rag/summarize    - Smart summarize
POST /api/rag/qa           - Generate Q&A
POST /api/rag/chat         - Knowledge chat
POST /api/rag/compare      - Compare documents
```

### API Keys
```
GET    /api/apikeys        - List API keys
POST   /api/apikeys        - Create API key
PATCH  /api/apikeys/:id/revoke - Revoke key
DELETE /api/apikeys/:id    - Delete key
```

---

## 👨‍💻 Author

**Roshan Kumar** — MCA Student passionate about MERN, Cloud & AI/ML

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Roshan%20Kumar-blue)](https://www.linkedin.com/in/roshan-gupta-340887227/)
[![GitHub](https://img.shields.io/badge/GitHub-Roshu09-black)](https://github.com/Roshu09)
[![Live Demo](https://img.shields.io/badge/Live-docmind.space-violet)](https://docmind.space)

---

*Built with ❤️ using React, Node.js, PostgreSQL, pgvector, Groq AI, and AWS*
