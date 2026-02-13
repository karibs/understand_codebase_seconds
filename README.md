# Architect - AI-Driven Workflow Builder

Human-in-the-loop 방식의 에이전틱(Agentic) 워크플로우 빌더

## Quick Start

### Backend (Flask)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
python app.py
```

Server runs at: http://localhost:5000

### Frontend (Vue 3)

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

App runs at: http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plan/init` | 아이디어 입력 → 초기 기획서 및 그래프 생성 |
| POST | `/api/prompt/generate` | 현재 노드 상태 기반 Claude용 프롬프트 생성 |
| POST | `/api/review/execute` | 코드 읽기 → 계약(Contract) 기반 AI 평가 수행 |
| GET | `/api/state/current` | 현재 워크플로우 진행 상태 및 Artifact 조회 |
| GET | `/api/files/list` | 프로젝트 파일 목록 조회 |
| POST | `/api/files/read` | 파일 내용 읽기 |
| GET | `/api/artifacts` | 산출물 목록 조회 |
| GET | `/api/artifacts/<filename>` | 특정 산출물 조회 |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vue 3 + Vue   │────▶│  Flask Backend  │────▶│  Gemini/OpenAI  │
│      Flow       │◀────│   + LangGraph   │◀────│    (PM & QA)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Local Files    │
                        │  (Read-Only)    │
                        └─────────────────┘
```

## Development Workflow

1. **Planning** → `overview.md`, `feature_list.md` 생성
2. **Publishing** → UI 컴포넌트 구현 → `ui-contract.md` 생성
3. **Front Logic** → 상태/로직 구현 → `logic-contract.md` 생성
4. **Backend** → API 구현 → `api-contract.md` 생성

각 단계는 이전 단계의 산출물을 기반으로 진행됩니다.

## Security

- **Root Confinement**: 모든 파일 접근은 PROJECT_ROOT 내로 제한
- **Read-Only Default**: 평가 시 읽기 권한만 사용
- **Whitelist Extensions**: `.vue`, `.js`, `.ts`, `.py`, `.md`, `.json`, `.css`, `.html`만 허용
