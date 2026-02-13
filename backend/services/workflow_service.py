"""
Workflow Service - LangGraph State Machine

Manages the workflow state and enforces stage transitions.
"""

import json
from typing import Dict, Any, List, Optional, TypedDict, Annotated
from enum import Enum
from dataclasses import dataclass, field, asdict
from pathlib import Path
import operator

from config import Config
from services.file_service import file_service
from services.ai_service import ai_service


class NodeStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    COMPLETED = "completed"
    FAILED = "failed"


class Stage(str, Enum):
    PLANNING = "planning"
    PUBLISHING = "publishing"
    LOGIC = "logic"
    BACKEND = "backend"
    COMPLETE = "complete"


@dataclass
class WorkflowNode:
    id: str
    type: str  # publishing, logic, backend
    position: Dict[str, int]
    data: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class WorkflowEdge:
    id: str
    source: str
    target: str
    animated: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class WorkflowState:
    """Complete workflow state."""
    project_idea: str = ""
    current_stage: Stage = Stage.PLANNING
    nodes: List[WorkflowNode] = field(default_factory=list)
    edges: List[WorkflowEdge] = field(default_factory=list)
    artifacts: Dict[str, str] = field(default_factory=dict)
    features: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_idea": self.project_idea,
            "current_stage": self.current_stage.value,
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "artifacts": self.artifacts,
            "features": self.features
        }


class WorkflowService:
    """
    Workflow management service with stage gating.

    Stage Entry/Exit Conditions:
    - Publishing: Requires feature_list.md, exits when all publishing nodes complete
    - Logic: Requires ui-contract.md, exits when all logic nodes complete
    - Backend: Requires logic-contract.md, exits when all backend nodes complete
    """

    STAGE_REQUIREMENTS = {
        Stage.PUBLISHING: ["feature_list.md"],
        Stage.LOGIC: ["ui-contract.md"],
        Stage.BACKEND: ["logic-contract.md"]
    }

    def __init__(self):
        self.state: Optional[WorkflowState] = None
        self._state_file = Config.PROJECT_ROOT / "workflow_state.json"

    def initialize_project_with_requirements(self, idea: str, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize project with refined requirements from chat.
        """
        # Generate plan from refined requirements
        plan = ai_service.generate_project_plan_with_requirements(idea, requirements)

        if "error" in plan:
            return {"error": plan["error"]}

        # Create workflow state
        self.state = WorkflowState(
            project_idea=idea,
            current_stage=Stage.PUBLISHING,
            features=plan.get("features", [])
        )

        # Parse nodes
        for node_data in plan.get("nodes", []):
            node = WorkflowNode(
                id=node_data["id"],
                type=node_data["type"],
                position=node_data.get("position", {"x": 0, "y": 0}),
                data=node_data.get("data", {})
            )
            self.state.nodes.append(node)

        # Parse edges
        for i, edge_data in enumerate(plan.get("edges", [])):
            edge = WorkflowEdge(
                id=edge_data.get("id", f"edge-{i+1}"),
                source=edge_data["source"],
                target=edge_data["target"]
            )
            self.state.edges.append(edge)

        # Generate overview with requirements info
        overview_content = f"""# {requirements.get('project_name', 'Project Overview')}

## Project Description
{requirements.get('description', plan.get('overview', ''))}

## Target Users
{requirements.get('target_users', 'N/A')}

## UI Style
{requirements.get('ui_style', 'N/A')}

## Technical Notes
{requirements.get('tech_notes', 'N/A')}

---

{plan.get('overview', '')}
"""

        features_content = self._format_features_md(plan.get("features", []))

        file_service.write_artifact("overview.md", overview_content)
        file_service.write_artifact("feature_list.md", features_content)

        self.state.artifacts = {
            "overview.md": overview_content,
            "feature_list.md": features_content
        }

        # Save state
        self._save_state()

        return self.state.to_dict()

    def initialize_project(self, idea: str) -> Dict[str, Any]:
        """
        Initialize a new project from an idea.

        1. Generate project plan via AI
        2. Create initial artifacts (overview.md, feature_list.md)
        3. Set up workflow nodes and edges
        """
        # Generate plan from AI
        plan = ai_service.generate_project_plan(idea)

        if "error" in plan:
            return {"error": plan["error"]}

        # Create workflow state
        self.state = WorkflowState(
            project_idea=idea,
            current_stage=Stage.PUBLISHING,
            features=plan.get("features", [])
        )

        # Parse nodes
        for node_data in plan.get("nodes", []):
            node = WorkflowNode(
                id=node_data["id"],
                type=node_data["type"],
                position=node_data.get("position", {"x": 0, "y": 0}),
                data=node_data.get("data", {})
            )
            self.state.nodes.append(node)

        # Parse edges
        for i, edge_data in enumerate(plan.get("edges", [])):
            edge = WorkflowEdge(
                id=edge_data.get("id", f"edge-{i+1}"),
                source=edge_data["source"],
                target=edge_data["target"]
            )
            self.state.edges.append(edge)

        # Generate and save initial artifacts
        overview_content = plan.get("overview", "")
        features_content = self._format_features_md(plan.get("features", []))

        overview_path = file_service.write_artifact("overview.md", f"# Project Overview\n\n{overview_content}")
        features_path = file_service.write_artifact("feature_list.md", features_content)

        self.state.artifacts = {
            "overview.md": overview_content,
            "feature_list.md": features_content
        }

        # Save state
        self._save_state()

        return self.state.to_dict()

    def get_current_state(self) -> Dict[str, Any]:
        """Get current workflow state."""
        if self.state is None:
            self._load_state()

        if self.state is None:
            return {
                "nodes": [],
                "edges": [],
                "artifacts": {},
                "stage": Stage.PLANNING.value,
                "initialized": False
            }

        return {
            **self.state.to_dict(),
            "initialized": True
        }

    def get_node(self, node_id: str) -> Optional[WorkflowNode]:
        """Get a specific node by ID."""
        if self.state is None:
            self._load_state()

        if self.state:
            for node in self.state.nodes:
                if node.id == node_id:
                    return node
        return None

    def update_node_status(self, node_id: str, status: NodeStatus, feedback: str = "") -> bool:
        """Update a node's status."""
        if self.state is None:
            self._load_state()

        if self.state is None:
            return False

        for node in self.state.nodes:
            if node.id == node_id:
                node.data["status"] = status.value
                if feedback:
                    node.data["feedback"] = feedback
                self._check_stage_transition()
                self._save_state()
                return True

        return False

    def generate_prompt(self, node_id: str) -> Dict[str, Any]:
        """Generate implementation prompt for a node."""
        node = self.get_node(node_id)
        if not node:
            return {"error": f"Node {node_id} not found"}

        # Update status to in_progress
        self.update_node_status(node_id, NodeStatus.IN_PROGRESS)

        # Gather contracts
        contracts = {}
        if node.type == "publishing":
            contracts["feature_list"] = self.state.artifacts.get("feature_list.md", "")
        elif node.type == "logic":
            contracts["ui_contract"] = self.state.artifacts.get("ui-contract.md", "")
            contracts["feature_list"] = self.state.artifacts.get("feature_list.md", "")
        elif node.type == "backend":
            contracts["logic_contract"] = self.state.artifacts.get("logic-contract.md", "")
            contracts["api_contract"] = self.state.artifacts.get("api-contract.md", "")

        # Read existing code files for context
        context_files = {}
        target_files = node.data.get("target_files", [])
        for file_path in target_files:
            content = file_service.read_file(file_path)
            if content:
                context_files[file_path] = content

        # Generate prompt
        prompt = ai_service.generate_implementation_prompt(
            node_data={**node.data, "type": node.type},
            contracts=contracts,
            context_files=context_files
        )

        # Save prompt to node data
        node.data["generated_prompt"] = prompt
        node.data["prompt_generated_at"] = __import__('datetime').datetime.now().isoformat()
        self._save_state()

        return {"prompt": prompt, "node_id": node_id}

    def execute_review(self, node_id: str) -> Dict[str, Any]:
        """Execute AI review for a node's implementation."""
        node = self.get_node(node_id)
        if not node:
            return {"error": f"Node {node_id} not found"}

        # Update status to in_review
        self.update_node_status(node_id, NodeStatus.IN_REVIEW)

        # Read implemented code
        code_files = {}
        target_files = node.data.get("target_files", [])
        for file_path in target_files:
            content = file_service.read_file(file_path)
            if content:
                code_files[file_path] = content
            else:
                code_files[file_path] = "[FILE NOT FOUND]"

        # Gather contracts for review
        contracts = {}
        artifact_name = node.data.get("linked_artifact", "")
        if artifact_name:
            contracts[artifact_name] = self.state.artifacts.get(
                artifact_name.split("/")[-1], ""
            )

        # Execute AI review
        review_result = ai_service.review_implementation(
            node_data={**node.data, "type": node.type},
            code_files=code_files,
            contracts=contracts
        )

        # Update node status based on review
        if review_result.get("status") == "pass":
            self.update_node_status(node_id, NodeStatus.COMPLETED, review_result.get("feedback", ""))
            self._check_and_generate_artifacts(node.type)
        else:
            self.update_node_status(node_id, NodeStatus.FAILED, review_result.get("feedback", ""))

        return {
            "node_id": node_id,
            "status": "completed" if review_result.get("status") == "pass" else "failed",
            "feedback": review_result.get("feedback", ""),
            "issues": review_result.get("issues", []),
            "suggestions": review_result.get("suggestions", [])
        }

    def scan_project_files(self) -> Dict[str, Any]:
        """
        Scan project directory to check which target_files exist.
        Auto-updates node statuses when all files are found.

        Returns:
            Scan report with per-node results and update counts.
        """
        if self.state is None:
            self._load_state()

        if self.state is None:
            return {"error": "No project initialized", "scanned": 0, "updated": 0, "results": []}

        results = []
        updated_count = 0

        for node in self.state.nodes:
            target_files = node.data.get("target_files", [])
            if not target_files:
                continue

            existence = file_service.check_files_exist(target_files)
            existing = [f for f, exists in existence.items() if exists]
            missing = [f for f, exists in existence.items() if not exists]

            node_result = {
                "node_id": node.id,
                "label": node.data.get("label", ""),
                "total_files": len(target_files),
                "existing_files": existing,
                "missing_files": missing,
                "all_exist": len(missing) == 0
            }
            results.append(node_result)

            # Auto-update status if all files exist and node is not yet completed
            current_status = node.data.get("status", "pending")
            if len(missing) == 0 and current_status in ("pending", "in_progress"):
                node.data["status"] = NodeStatus.COMPLETED.value
                updated_count += 1

        # Check stage transitions after updates
        if updated_count > 0:
            self._check_stage_transition()
            self._save_state()

        return {
            "scanned": len(results),
            "updated": updated_count,
            "results": results
        }

    def _check_stage_transition(self):
        """Check if we should transition to the next stage."""
        if self.state is None:
            return

        stage_nodes = {
            Stage.PUBLISHING: [n for n in self.state.nodes if n.type == "publishing"],
            Stage.LOGIC: [n for n in self.state.nodes if n.type == "logic"],
            Stage.BACKEND: [n for n in self.state.nodes if n.type == "backend"]
        }

        current_stage_nodes = stage_nodes.get(self.state.current_stage, [])

        # Check if all nodes in current stage are completed
        all_completed = all(
            n.data.get("status") == NodeStatus.COMPLETED.value
            for n in current_stage_nodes
        )

        if all_completed and current_stage_nodes:
            # Transition to next stage
            stage_order = [Stage.PUBLISHING, Stage.LOGIC, Stage.BACKEND, Stage.COMPLETE]
            current_index = stage_order.index(self.state.current_stage)
            if current_index < len(stage_order) - 1:
                self.state.current_stage = stage_order[current_index + 1]

    def _check_and_generate_artifacts(self, completed_type: str):
        """Generate artifacts when a stage completes."""
        if self.state is None:
            return

        # Check if all nodes of this type are completed
        type_nodes = [n for n in self.state.nodes if n.type == completed_type]
        all_completed = all(
            n.data.get("status") == NodeStatus.COMPLETED.value
            for n in type_nodes
        )

        if not all_completed:
            return

        # Generate appropriate artifact
        context = {
            "features": self.state.features,
            "existing_artifacts": self.state.artifacts,
            "completed_nodes": [n.to_dict() for n in type_nodes]
        }

        if completed_type == "publishing":
            content = ai_service.generate_artifact("ui-contract", context)
            file_service.write_artifact("ui-contract.md", content)
            self.state.artifacts["ui-contract.md"] = content

        elif completed_type == "logic":
            content = ai_service.generate_artifact("logic-contract", context)
            file_service.write_artifact("logic-contract.md", content)
            self.state.artifacts["logic-contract.md"] = content

        elif completed_type == "backend":
            content = ai_service.generate_artifact("api-contract", context)
            file_service.write_artifact("api-contract.md", content)
            self.state.artifacts["api-contract.md"] = content

    def _format_features_md(self, features: List[Dict]) -> str:
        """Format features list as markdown."""
        lines = ["# Feature List\n"]

        for feature in features:
            priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(
                feature.get("priority", "medium"), "⚪"
            )
            lines.append(f"## {feature.get('id', '?')}. {feature.get('name', 'Unnamed')}")
            lines.append(f"**Priority:** {priority_emoji} {feature.get('priority', 'medium')}\n")
            lines.append(feature.get("description", "No description."))
            lines.append("")

        return "\n".join(lines)

    def _save_state(self):
        """Persist state to file."""
        if self.state:
            Config.ensure_workspace()
            self._state_file.write_text(
                json.dumps(self.state.to_dict(), indent=2, ensure_ascii=False),
                encoding='utf-8'
            )

    def _load_state(self):
        """Load state from file."""
        if self._state_file.exists():
            try:
                data = json.loads(self._state_file.read_text(encoding='utf-8'))
                self.state = WorkflowState(
                    project_idea=data.get("project_idea", ""),
                    current_stage=Stage(data.get("current_stage", "planning")),
                    artifacts=data.get("artifacts", {}),
                    features=data.get("features", [])
                )

                # Reconstruct nodes
                for node_data in data.get("nodes", []):
                    self.state.nodes.append(WorkflowNode(
                        id=node_data["id"],
                        type=node_data["type"],
                        position=node_data["position"],
                        data=node_data["data"]
                    ))

                # Reconstruct edges
                for edge_data in data.get("edges", []):
                    self.state.edges.append(WorkflowEdge(
                        id=edge_data["id"],
                        source=edge_data["source"],
                        target=edge_data["target"],
                        animated=edge_data.get("animated", False)
                    ))
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Failed to load state: {e}")
                self.state = None


# Singleton instance
workflow_service = WorkflowService()
