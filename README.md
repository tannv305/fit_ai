# AI Fashion Shop

AI-powered Clothing E-Commerce Application with Spring Boot backend, React + Vite frontend, and Python FastAPI AI Service (MediaPipe, Pose Detection, Virtual Try-On, and LLM Recommendation).

## Project Structure

```text
fit_ai/
├── backend/          # Java Spring Boot REST API
├── frontend/         # React + Vite + Tailwind CSS UI
├── ai-service/       # Python FastAPI for Pose Detection & Try-On
├── database/         # PostgreSQL schema & seed files
│   ├── schema.sql
│   └── seed.sql
├── docker-compose.yml
└── PROJECT_SPEC.md   # Single Source of Truth specification
```

## Quick Start (Docker)

```bash
cp .env.example .env
docker-compose up -d
```

## Manual Setup

### 1. Database
Ensure PostgreSQL is running with `pgvector` and `pgcrypto` extensions enabled, then run `database/schema.sql` and `database/seed.sql`.

### 2. Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
App runs at `http://localhost:8080`.

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173`.

### 4. AI Service (FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API runs at `http://localhost:8000`.
