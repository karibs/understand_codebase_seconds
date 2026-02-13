"""
AI Service - Integration with OpenAI and Google Gemini

Roles:
- PM Agent: Project planning, task instructions, structure design
- QA Agent: Code review, contract verification, acceptance testing
"""

import json
import traceback
from typing import Dict, Any, Optional
from config import Config

# Lazy imports for AI clients
_openai_client = None
_gemini_client = None


def get_openai_client():
    global _openai_client
    if _openai_client is None and Config.OPENAI_API_KEY:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=Config.OPENAI_API_KEY)
    return _openai_client


def get_gemini_client():
    global _gemini_client
    if _gemini_client is None and Config.GEMINI_API_KEY:
        from google import genai
        _gemini_client = genai.Client(api_key=Config.GEMINI_API_KEY)
    return _gemini_client


class AIService:
    """AI Service for PM and QA operations."""

    # System prompts for different roles
    PM_SYSTEM_PROMPT = """You are an AI Project Manager (PM) and Software Architect for a web application project.

Your responsibilities:
1. Analyze project ideas and create comprehensive planning documents
2. Break down features into actionable development tasks
3. Create clear, structured development roadmaps
4. Write detailed task instructions for implementers

Rules:
- Be specific and actionable in your instructions
- Consider both frontend and backend requirements
- Follow contract-based development (each stage's output is the next stage's input)
- Focus on the "why" and "what", leave "how" to implementers

Output format: Always respond in valid JSON when requested."""

    QA_SYSTEM_PROMPT = """You are an AI QA Engineer responsible for code review and verification.

Your responsibilities:
1. Review code against UI/Logic/API contracts
2. Verify acceptance criteria are met
3. Identify issues and provide specific feedback
4. Determine if a task passes or fails review

Rules:
- Be objective and thorough
- Reference specific contract requirements
- Provide actionable feedback for failures
- Only pass code that fully meets criteria

Output format: Always respond in valid JSON with 'status' (pass/fail) and 'feedback' fields."""

    def __init__(self):
        self.provider = Config.AI_PROVIDER

    def _call_openai(self, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Call OpenAI API."""
        client = get_openai_client()
        if not client:
            raise ValueError("OpenAI API key not configured")

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"} if json_mode else None,
            temperature=0.7
        )
        return response.choices[0].message.content

    def _call_gemini(self, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Call Google Gemini API."""
        client = get_gemini_client()
        if not client:
            raise ValueError("Gemini API key not configured")

        full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"
        if json_mode:
            full_prompt += "\n\nRespond only with valid JSON."

        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=full_prompt
            )
            return response.text
        except Exception as e:
            print(f"[Gemini API Error] {e}")
            traceback.print_exc()
            raise

    def _call_ai(self, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Call the configured AI provider."""
        try:
            if self.provider == 'openai':
                return self._call_openai(system_prompt, user_prompt, json_mode)
            else:
                return self._call_gemini(system_prompt, user_prompt, json_mode)
        except Exception as e:
            print(f"[AI Service Error] Provider: {self.provider}, Error: {e}")
            traceback.print_exc()
            raise

    PLANNING_CHAT_PROMPT = """You are an AI Project Manager helping to refine a web application idea.

Your goal is to:
1. Understand the user's project idea thoroughly
2. Ask clarifying questions (2-4 questions at a time)
3. Identify missing requirements
4. Summarize the refined requirements when complete

Guidelines:
- Be friendly and conversational in Korean
- Ask about: target users, core features, authentication needs, UI preferences, integrations
- After 2-3 exchanges, provide a summary of requirements
- When requirements are clear, include a JSON summary in your response

When ready to summarize, format your response like:
[Your conversational message]

```json
{
  "ready": true,
  "summary": {
    "project_name": "Project name",
    "description": "Project description",
    "target_users": "Target users",
    "core_features": ["Feature1", "Feature2", ...],
    "auth_required": true/false,
    "ui_style": "UI style description",
    "tech_notes": "Technical notes"
  }
}
```"""

    def chat_for_planning(self, idea: str, messages: list) -> Dict[str, Any]:
        """
        Chat with user to refine project requirements.

        Returns:
            {
                "message": "AI response text",
                "summary": {...} if requirements are complete, else None
            }
        """
        # Build conversation context
        conversation = f"Project idea: {idea}\n\n"

        if not messages:
            # First message - ask initial questions
            conversation += "This is the user's first input. Please ask friendly questions to better understand the project."
        else:
            # Continue conversation
            for msg in messages:
                role = "User" if msg["role"] == "user" else "AI"
                conversation += f"{role}: {msg['content']}\n"
            conversation += "\nBased on the conversation above, ask follow-up questions or organize the requirements if enough information has been gathered."

        try:
            response = self._call_ai(self.PLANNING_CHAT_PROMPT, conversation, json_mode=False)

            # Check if response contains summary JSON
            summary = None
            if "```json" in response:
                import re
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
                if json_match:
                    try:
                        parsed = json.loads(json_match.group(1))
                        if parsed.get("ready"):
                            summary = parsed.get("summary")
                        # Remove JSON block from message
                        response = re.sub(r'```json\s*[\s\S]*?\s*```', '', response).strip()
                    except json.JSONDecodeError:
                        pass

            return {
                "message": response,
                "summary": summary
            }

        except Exception as e:
            print(f"[chat_for_planning] Error: {e}")
            traceback.print_exc()
            return {
                "message": "Sorry, an error occurred. Please try again.",
                "summary": None
            }

    def generate_project_plan_with_requirements(self, idea: str, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate project plan from refined requirements.
        """
        prompt = f"""Given these refined project requirements, create a complete project plan.

PROJECT IDEA: {idea}

REFINED REQUIREMENTS:
- Project Name: {requirements.get('project_name', 'Unnamed')}
- Description: {requirements.get('description', '')}
- Target Users: {requirements.get('target_users', '')}
- Core Features: {json.dumps(requirements.get('core_features', []), ensure_ascii=False)}
- Authentication Required: {requirements.get('auth_required', False)}
- UI Style: {requirements.get('ui_style', '')}
- Tech Notes: {requirements.get('tech_notes', '')}

Generate a JSON response with:
1. "overview": A comprehensive project overview based on the requirements
2. "features": Array of features derived from core_features, each with:
   - "id": Feature ID (e.g., "F1", "F2")
   - "name": Feature name
   - "description": Detailed description
   - "priority": "high", "medium", or "low"
3. "nodes": Array of workflow nodes for Vue Flow, each with:
   - "id": Unique node ID (e.g., "node-publishing-01")
   - "type": "publishing", "logic", or "backend"
   - "position": {{"x": number, "y": number}}
   - "data": {{
       "label": Task name,
       "status": "pending",
       "linked_artifact": Related document path,
       "target_files": Array of target file paths,
       "acceptance_criteria": Array of criteria strings,
       "feature_id": Related feature ID
     }}
4. "edges": Array of connections between nodes:
   - "id": Edge ID (e.g., "edge-1")
   - "source": Source node ID
   - "target": Target node ID

IMPORTANT — Project Setup Node:
You MUST include a "Project Setup" node as the FIRST publishing node.
This node initializes the project scaffold so it can actually run.
- id: "node-setup-01"
- type: "publishing"
- position: {{"x": 100, "y": 0}}
- data.label: "Project Setup"
- data.status: "pending"
- data.target_files: ["package.json", "vite.config.js", "index.html", "src/main.js", "src/style.css"]
- data.acceptance_criteria: [
    "package.json has correct name, scripts (dev/build/preview), and all required dependencies",
    "vite.config.js is properly configured for the chosen framework",
    "index.html includes root mount element and correct script entry",
    "src/main.js initializes the app and mounts to DOM",
    "Running npm install && npm run dev starts the development server"
  ]
All other publishing nodes should have an edge FROM this setup node (source: "node-setup-01", target: other publishing node).

Create nodes based on the actual features. Position: publishing (x: 0-200), logic (x: 300-500), backend (x: 600-800)."""

        response = self._call_ai(self.PM_SYSTEM_PROMPT, prompt)
        return self._parse_json_response(response)

    def generate_project_plan(self, idea: str) -> Dict[str, Any]:
        """
        Generate initial project plan from an idea.

        Returns:
            {
                "overview": "...",
                "features": [...],
                "nodes": [...],
                "edges": [...]
            }
        """
        prompt = f"""Given this web application idea, create a complete project plan.

IDEA: {idea}

Generate a JSON response with:
1. "overview": A comprehensive project overview (2-3 paragraphs)
2. "features": Array of features, each with:
   - "id": Feature ID (e.g., "F1", "F2")
   - "name": Feature name
   - "description": Detailed description
   - "priority": "high", "medium", or "low"
3. "nodes": Array of workflow nodes for Vue Flow, each with:
   - "id": Unique node ID (e.g., "node-publishing-01")
   - "type": "publishing", "logic", or "backend"
   - "position": {{"x": number, "y": number}} (arrange in 3 columns by type)
   - "data": {{
       "label": Task name,
       "status": "pending",
       "linked_artifact": Related document path,
       "target_files": Array of target file paths,
       "acceptance_criteria": Array of criteria strings,
       "feature_id": Related feature ID
     }}
4. "edges": Array of connections between nodes:
   - "id": Edge ID
   - "source": Source node ID
   - "target": Target node ID

IMPORTANT — Project Setup Node:
You MUST include a "Project Setup" node as the FIRST publishing node.
This node initializes the project scaffold so it can actually run.
- id: "node-setup-01"
- type: "publishing"
- position: {{"x": 100, "y": 0}}
- data.label: "Project Setup"
- data.status: "pending"
- data.target_files: ["package.json", "vite.config.js", "index.html", "src/main.js", "src/style.css"]
- data.acceptance_criteria: [
    "package.json has correct name, scripts (dev/build/preview), and all required dependencies",
    "vite.config.js is properly configured for the chosen framework",
    "index.html includes root mount element and correct script entry",
    "src/main.js initializes the app and mounts to DOM",
    "Running npm install && npm run dev starts the development server"
  ]
All other publishing nodes should have an edge FROM this setup node (source: "node-setup-01", target: other publishing node).

Create at least 3-4 nodes per type (publishing, logic, backend), properly connected to show dependencies.
Position nodes: publishing (x: 0-200), logic (x: 300-500), backend (x: 600-800).
Y positions should be staggered (0, 150, 300, etc.)."""

        response = self._call_ai(self.PM_SYSTEM_PROMPT, prompt)
        return self._parse_json_response(response)

    def generate_implementation_prompt(
        self,
        node_data: Dict[str, Any],
        contracts: Dict[str, str],
        context_files: Dict[str, str]
    ) -> str:
        """
        Generate a detailed implementation prompt for Claude/Codex.

        Args:
            node_data: The node's data object
            contracts: Related contract documents
            context_files: Existing code files for context

        Returns:
            Implementation prompt string
        """
        prompt = f"""Generate a detailed implementation prompt for a developer (or coding AI like Claude).

TASK: {node_data.get('label', 'Unknown Task')}
TYPE: {node_data.get('type', 'unknown')}
TARGET FILES: {json.dumps(node_data.get('target_files', []))}

ACCEPTANCE CRITERIA:
{json.dumps(node_data.get('acceptance_criteria', []), indent=2)}

RELATED CONTRACTS:
{json.dumps(contracts, indent=2)}

EXISTING CODE CONTEXT:
{json.dumps(context_files, indent=2)}

Generate a JSON response with:
1. "prompt": The full implementation prompt (detailed, actionable instructions)
2. "key_points": Array of key implementation points
3. "warnings": Array of potential pitfalls to avoid"""

        response = self._call_ai(self.PM_SYSTEM_PROMPT, prompt)
        result = self._parse_json_response(response)
        return result.get('prompt', 'Failed to generate prompt')

    def review_implementation(
        self,
        node_data: Dict[str, Any],
        code_files: Dict[str, str],
        contracts: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Review implementation against contracts and criteria.

        Returns:
            {
                "status": "pass" or "fail",
                "feedback": Detailed feedback string,
                "issues": Array of specific issues (if any),
                "suggestions": Array of improvement suggestions
            }
        """
        prompt = f"""Review this implementation against the contracts and acceptance criteria.

TASK: {node_data.get('label', 'Unknown Task')}

ACCEPTANCE CRITERIA:
{json.dumps(node_data.get('acceptance_criteria', []), indent=2)}

CONTRACTS:
{json.dumps(contracts, indent=2)}

IMPLEMENTATION CODE:
{json.dumps(code_files, indent=2)}

Evaluate each acceptance criterion and determine if the implementation passes.
Be strict but fair - only pass if ALL criteria are fully met.

Respond with JSON:
{{
  "status": "pass" or "fail",
  "feedback": "Overall assessment...",
  "criteria_results": [
    {{"criterion": "...", "passed": true/false, "notes": "..."}}
  ],
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}}"""

        response = self._call_ai(self.QA_SYSTEM_PROMPT, prompt)
        return self._parse_json_response(response)

    def generate_artifact(self, artifact_type: str, context: Dict[str, Any]) -> str:
        """
        Generate an artifact document (ui-contract, logic-contract, api-contract).

        Args:
            artifact_type: Type of artifact to generate
            context: Context including features, existing artifacts, etc.

        Returns:
            Markdown content for the artifact
        """
        templates = {
            'ui-contract': """Generate a UI Contract document in Markdown format.

Context: {context}

Include:
1. Screen/Page definitions
2. Component hierarchy
3. UI state descriptions
4. User interaction flows
5. Responsive design notes""",

            'logic-contract': """Generate a Logic Contract document in Markdown format.

Context: {context}

Include:
1. State management structure
2. Data flow definitions
3. Component logic specifications
4. Event handling patterns
5. Validation rules""",

            'api-contract': """Generate an API Contract document in Markdown format.

Context: {context}

Include:
1. Endpoint definitions (method, path, description)
2. Request/Response schemas
3. Authentication requirements
4. Error response formats
5. Data models"""
        }

        template = templates.get(artifact_type, templates['ui-contract'])
        prompt = template.format(context=json.dumps(context, indent=2))

        response = self._call_ai(self.PM_SYSTEM_PROMPT, prompt + "\n\nRespond with ONLY the markdown content, no JSON wrapper.", json_mode=False)
        return response

    def generate_setup_prompt(self, project_state: Dict[str, Any]) -> str:
        """
        Generate a comprehensive scaffold/setup prompt that the user can feed
        to an external AI to create all the project bootstrap files.
        """
        # Gather info from the current project state
        nodes = project_state.get("nodes", [])
        features = project_state.get("features", [])
        idea = project_state.get("project_idea", "Web application")

        # Collect all target_files to infer dependencies / framework
        all_target_files = []
        for node in nodes:
            data = node.get("data", {})
            all_target_files.extend(data.get("target_files", []))

        # Deduplicate while preserving order
        seen = set()
        unique_files = []
        for f in all_target_files:
            if f not in seen:
                seen.add(f)
                unique_files.append(f)

        feature_summary = "\n".join(
            f"- {f.get('name', f.get('id', ''))}: {f.get('description', '')}"
            for f in features
        ) if features else "Not specified"

        prompt = f"""Create the complete project scaffold for the following web application.

PROJECT: {idea}

FEATURES:
{feature_summary}

ALL TARGET FILES ACROSS THE PROJECT:
{json.dumps(unique_files, indent=2)}

Generate the following files with complete, working content:

1. **package.json**
   - Project name (kebab-case from the project idea)
   - Scripts: dev, build, preview
   - All dependencies needed for the target files above (Vue/React/etc., router, state management, etc.)
   - All devDependencies (Vite, framework plugin, etc.)

2. **vite.config.js**
   - Proper plugin for the chosen framework
   - Alias for `@` → `./src`

3. **index.html**
   - Root mount element (e.g., `<div id="app"></div>`)
   - `<script type="module" src="/src/main.js"></script>`

4. **src/main.js**
   - Import framework, router, store as needed
   - Create and mount the app

5. **src/style.css**
   - CSS reset / base styles
   - CSS custom properties for theming

6. **Folder structure** — provide the `mkdir -p` commands to create all necessary directories

7. **Setup instructions**:
   ```
   npm install
   npm run dev
   ```

Output each file with its full path and complete content, ready to copy-paste."""

        return prompt

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from AI response, handling potential formatting issues."""
        try:
            # Try direct parse
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code block
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass

            # Return error structure
            return {
                "error": "Failed to parse AI response",
                "raw_response": response[:500]
            }


# Singleton instance
ai_service = AIService()
