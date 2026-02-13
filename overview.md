# 프로젝트 명: AI-Driven Workflow Builder ('Architect')

## 1. 개요 (Overview)
본 프로젝트는 "AI가 기획 및 관리(PM)를 담당하고, 인간(또는 Coding AI)이 실무를 수행하는" **Human-in-the-loop** 방식의 에이전틱(Agentic) 워크플로우 빌더이다.

사용자가 웹앱에 대한 아이디어를 입력하면, 시스템은 전체 기획서를 생성하고 이를 바탕으로 프론트엔드와 백엔드로 구분된 **순차적 개발 로드맵(Graph)**을 시각화한다. 
단순한 코드 생성이 아닌, 각 단계마다 **명확한 산출물(Artifact)**을 기반으로 평가하고 승인하는 구조를 가진다.

### 1.1. 단계별 필수 산출물 (Artifacts)
모든 개발 단계는 다음 문서가 생성되어야만 '완료'로 간주된다.
* **Planning 단계:** `overview.md`, `feature_list.md`
* **Publishing 단계:** `ui-contract.md` (화면 정의 및 컴포넌트 구조)
* **Logic 단계:** `logic-contract.md` (프론트 데이터 흐름 및 상태 정의)
* **Backend 단계:** `api-contract.md` (API 명세 및 데이터 스키마)

## 2. 핵심 철학 및 운영 규칙 (Philosophy & Rules)

### 2.1. 순차적 개발과 계약 (Sequential & Contract)
빅뱅(Big-bang) 방식을 지양하고, 앞 단계의 산출물이 뒷 단계의 입력이 되는 **계약 기반 개발(Contract-based Development)**을 원칙으로 한다.

### 2.2. 단계 진입 및 종료 조건 (Gate Keeping)
시스템은 LangGraph의 상태 제어를 통해 다음 조건을 강제한다.

| Stage | Entry Condition (진입 조건) | Exit Condition (종료 조건) |
| :--- | :--- | :--- |
| **Publishing** | `feature_list.md` 확정 | 모든 화면 퍼블리싱 완료, `ui-contract.md` 생성, QA 체크리스트 통과 |
| **Front Logic** | `ui-contract.md` 존재 | API 연동 준비 완료, `logic-contract.md` 생성 |
| **Backend** | `logic-contract.md` 존재 | API 구현 및 테스트 통과, `api-contract.md` 갱신 |

## 3. 역할 및 책임 경계 (Roles & Responsibilities)
분쟁과 혼란을 방지하기 위해 AI와 인간(실무자)의 책임을 명확히 구분한다.

* **Gemini/OpenAI (PM & Architect):**
    * 역할: 작업 지시서(Prompt) 작성, 결과물 평가, 구조적 설계.
    * **책임:** 기획의 논리적 모순, 요구사항 누락, 평가 기준의 정확성.
* **Human + Claude/Codex (Implementer):**
    * 역할: 지시서에 따른 실제 코딩, IDE 사용.
    * **책임:** 구문 오류(Syntax Error), 구현 로직의 디테일, 코드 품질.

## 4. 기술 스택 (Tech Stack)

### Frontend
* **Framework:** Vue.js 3 (Composition API)
* **Visualization:** Vue Flow (노드 기반 그래프 UI)
* **State Management:** Pinia (워크플로우 상태 동기화)

### Backend & AI Engine
* **Server:** Python Flask
* **AI Orchestration:** LangGraph (State Machine 구현)
* **LLM Interface:** OpenAI API (GPT-4o), Google Gemini API (1.5 Pro/Flash)
* **System Control:** Python `os`, `glob` (로컬 파일 제어)

## 5. 시스템 아키텍처 (Architecture)

```mermaid
graph TD
    User[User (Developer)] -->|1. Idea Input| UI[Vue 3 Frontend]
    UI -->|2. Request Plan| Server[Flask Backend]
    
    subgraph "State Management"
        Server <--> StateStore[Workflow State & Artifacts DB]
    end

    Server -->|3. Generate MD & Graph| AI_PM[Gemini (PM Agent)]
    
    subgraph "Development Loop"
        UI -->|4. Get Prompt (from Artifacts)| AI_PM
        User -->|5. Implementation (w/ Claude)| IDE[Local VS Code]
        IDE -->|6. Save File| LocalStorage[Local File System]
        UI -->|7. Request Review| Server
        Server -->|8. Read Code (Safe Mode)| LocalStorage
        Server -->|9. Verify against Contracts| AI_QA[Gemini (QA Agent)]
        AI_QA -->|10. Pass/Fail Feedback| StateStore
        StateStore -->|11. Update Node Status| UI
    end

6. 상세 기능 명세 (Functional Specifications)6.1. 보안 및 파일 시스템 접근 정책 (FS Policy)백엔드가 로컬 파일을 읽을 때 발생할 수 있는 사고를 방지하기 위해 다음 정책을 코드로 강제한다.Root Confinement: 설정된 PROJECT_ROOT 경로 상위로 이동(.. 등) 불가.Read-Only Default: 평가는 오직 '읽기' 권한만 사용.Whitelist Extensions: .vue, .js, .ts, .py, .md, .json 파일만 접근 허용.6.2. 노드 데이터 구조 (Node Schema)상태 추적을 위해 노드는 status와 연결된 artifact 정보를 포함한다.JSON{
  "id": "node-frontend-01",
  "type": "publishing",
  "data": {
    "label": "메인 페이지 퍼블리싱",
    "status": "in_review",
    "linked_artifact": "docs/ui-contract.md",
    "target_files": ["src/views/Home.vue"],
    "acceptance_criteria": [
       "Feature List의 1-1 항목 구현 여부",
       "UI Contract 준수 여부"
    ]
  }
}
7. API 설계 (Flask Endpoints)MethodEndpointDescriptionPOST/api/plan/init아이디어 입력 → 초기 기획서 및 그래프 생성POST/api/prompt/generate현재 노드 상태 기반 Claude용 프롬프트 생성POST/api/review/execute코드 읽기 → 계약(Contract) 기반 AI 평가 수행GET/api/state/current현재 워크플로우 진행 상태 및 Artifact 조회8. 개발 로드맵 (Roadmap)Phase 1: Core Engine & Contracts[ ] Flask 서버 구축 및 Project Root 보안 로직 구현.[ ] read_local_code 기능 구현 (확장자 필터링 포함).[ ] Artifact(MD) 생성 및 파싱 로직 구현.Phase 2: Visualization & Loop[ ] Vue Flow 연동 및 상태(Color) 시각화.[ ] 평가 루프(프롬프트 생성 -> 평가 -> 승인) UI 구현.Phase 3: Refinement[ ] 단계별 진입/종료 조건(Gate) 검증 로직 강화.[ ] 시스템 프롬프트 튜닝 (책임 경계 명확화).	
	
	
