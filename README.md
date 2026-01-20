# Polymath UI

**Polymath UI** is a specialized dashboard designed for monitoring and interacting with a multi-agent mathematical reasoning system. It provides real-time visualization of agent thought processes, tool executions, and a growing knowledge graph of mathematical statements.

## Features

### 🚀 Mission Control
*Located in the Left Panel (`TraceMonitor.jsx`)*
- **Agent Interaction**: specific interface to submit mathematical problems (supports LaTeX) to the backend agent system.
- **Live Tracing**: real-time log of agent activities, including:
    - 💬 Text Messages (Thoughts & Responses)
    - 🛠️ Tool Call Requests & Executions
    - 🔄 Sub-agent Workflows
- **Smart Preview**: Auto-rendering of mathematical formulas as you type.

### 🕸️ Knowledge Graph
*Located in the Center Panel (`AutoGraph.jsx`)*
- **Interactive Visualization**: A 2D force-directed graph (powered by `react-force-graph` and Neo4j) showing the relationships between mathematical entities.
- **Node Types**:
    - **Statements**: Mathematical propositions or definitions.
    - **Implications**: Logic connections between statements.
- **Live Updates**: The graph polls the database to reflect the system's growing knowledge base in real-time.

### 🔍 Inspector Panel
*Located in the Right Panel (`InspectorPanel.jsx`)*
- **Deep Dive**: Click on any node or edge in the graph to view its details.
- **Math Rendering**: Beautifully renders (via KaTeX) the human-readable representations of formal mathematical statements.
- **Metadata Viewer**: Inspect embeddings, verification status, and tags.

## Tech Stack

- **Frontend Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Visualization**: `react-force-graph-2d`, `lucide-react`
- **Math Rendering**: `katex`, `react-katex`
- **Database**: Neo4j (via `neo4j-driver`)

## Prerequisites

Before running the UI, ensure you have the following services active:

1.  **Neo4j Database**:
    - Expected at: `bolt://localhost:7687`
    - Default Credentials: `neo4j` / `let_me_in_please`
    - *Note: Connection details are currently hardcoded in `src/components/AutoGraph.jsx`.*

2.  **Polymath Backend API**:
    - Expected at: `http://localhost:8080`
    - Endpoints used: `/get_status`, `/set_problem`
    - *Note: API URL is currently hardcoded in `src/components/TraceMonitor.jsx`.*

## Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd polymath-ui
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Project Structure

```bash
src/
├── components/
│   ├── AutoGraph.jsx       # Neo4j graph visualization
│   ├── InspectorPanel.jsx  # Details side-panel
│   ├── SmartMathText.jsx   # Math/LaTeX rendering utility
│   └── TraceMonitor.jsx    # Agent interaction and logs
├── utils/
│   └── graphUtils.js       # Data transformers for Neo4j -> Graph
├── App.jsx                 # Main layout and state orchestration
└── main.jsx                # Entry point
```

## Contributing

The project is currently in early development. Configuration values (API URLs, DB credentials) are hardcoded and will be moved to environment variables in future updates.
