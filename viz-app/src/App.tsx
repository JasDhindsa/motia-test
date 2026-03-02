import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Monitor,
  Cpu,
  Database,
  Layers,
  Activity,
  Zap,
  Box,
  Terminal,
  Grid,
  Search,
  Plus,
  Home,
  Settings,
  Shield,
  HelpCircle,
  FolderTree,
  Share2,
  List,
  RefreshCw,
  Maximize,
  LayoutGrid,
  Workflow,
  Globe,
  Radio
} from 'lucide-react';
import './index.css';

// --- Types ---
interface CodebaseNodeData {
  label: string;
  type: 'frontend' | 'backend' | 'database' | 'group' | 'api' | 'service';
  url?: string;
  description?: string;
  rows?: { key: string; val: string }[];
  icon?: React.ReactNode;
  method?: string;
}

// --- Custom Node Components ---

const GroupNode = ({ data }: { data: CodebaseNodeData }) => (
  <div className="group-node" style={{ width: '100%', height: '100%' }}>
    <div className="group-label">{data.label}</div>
  </div>
);

const PageNode = ({ data }: { data: CodebaseNodeData }) => (
  <div className="fe-page-node shadow-glow" style={{ width: data.type === 'backend' ? 1000 : 700 }}>
    <div className="node-header-lite">
      {data.type === 'frontend' ? <Monitor size={14} /> : <Terminal size={14} style={{ color: 'var(--accent-purple)' }} />}
      <span>{data.label}</span>
      <div className="status-dot-active"></div>
    </div>
    <div className="node-preview" style={{ height: data.type === 'backend' ? 600 : 450 }}>
      {data.url && (
        <iframe
          src={data.url}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title={data.label}
        />
      )}
    </div>
    <Handle type="source" position={Position.Right} id="right" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Top} id="top" />
  </div>
);

const ServiceBlockNode = ({ data }: { data: CodebaseNodeData }) => (
  <div className="be-block-node active-pulse" style={{ width: 320, padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div className="element-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)' }}>
        {data.icon || <Cpu size={18} />}
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: 14 }}>{data.label}</h4>
        <span style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase' }}>Core Service</span>
      </div>
    </div>
    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.description}</p>
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
  </div>
);

const ApiNode = ({ data }: { data: CodebaseNodeData }) => (
  <div className="api-node">
    <div className="api-method">{data.method || 'GET'}</div>
    <div className="api-path">{data.label}</div>
    <Handle type="target" position={Position.Left} id="in" />
    <Handle type="source" position={Position.Right} id="out" />
  </div>
);

const DbTableNode = ({ data }: { data: CodebaseNodeData }) => (
  <div className="db-table-node">
    <div className="db-header">
      <Database size={14} />
      <span>{data.label}</span>
    </div>
    <div className="db-rows">
      {data.rows?.map((row, idx) => (
        <div key={idx} className="db-row">
          <span className="db-key">{row.key}</span>
          <span className="db-val">{row.val}</span>
        </div>
      ))}
    </div>
    <Handle type="target" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Top} id="top" />
  </div>
);

const nodeTypes = {
  groupNode: GroupNode,
  pageNode: PageNode,
  serviceNode: ServiceBlockNode,
  dbTableNode: DbTableNode,
  apiNode: ApiNode
};

// --- Initial Data ---

const generateInitialData = () => {
  const nodes: Node<CodebaseNodeData>[] = [
    // Section Groups (Macro View)
    {
      id: 'grp-frontend',
      type: 'groupNode',
      position: { x: 150, y: 150 },
      data: { label: 'FRONTEND WORKSPACE', type: 'group' },
      style: { width: 1400, height: 2600 }
    },
    {
      id: 'grp-backend',
      type: 'groupNode',
      position: { x: 1700, y: 550 },
      data: { label: 'BACKEND SYSTEM', type: 'group' },
      style: { width: 4500, height: 3500 }
    },
    {
      id: 'grp-database',
      type: 'groupNode',
      position: { x: 1700, y: 50 },
      data: { label: 'DATA REPOSITORY', type: 'group' },
      style: { width: 2500, height: 450 }
    },

    // --- FRONTEND NODES ---
    {
      id: 'node-fe-dashboard',
      type: 'pageNode',
      position: { x: 100, y: 150 },
      data: { label: 'Motia Dashboard', type: 'frontend', url: 'http://localhost:5174/?tab=dashboard' },
      parentNode: 'grp-frontend', extent: 'parent'
    },
    {
      id: 'node-fe-tickets',
      type: 'pageNode',
      position: { x: 100, y: 950 },
      data: { label: 'Ticket Grid View', type: 'frontend', url: 'http://localhost:5174/?tab=tickets' },
      parentNode: 'grp-frontend', extent: 'parent'
    },

    // --- BACKEND NODES ---
    // Massive Console Pages
    {
      id: 'node-be-flow',
      type: 'pageNode',
      position: { x: 100, y: 150 },
      data: { label: 'Flow Engine Designer', type: 'backend', url: 'http://localhost:3113/flow' },
      parentNode: 'grp-backend', extent: 'parent'
    },
    {
      id: 'node-be-functions',
      type: 'pageNode',
      position: { x: 100, y: 1050 },
      data: { label: 'Workflow Definition (Functions)', type: 'backend', url: 'http://localhost:3113/functions' },
      parentNode: 'grp-backend', extent: 'parent'
    },
    {
      id: 'node-be-states',
      type: 'pageNode',
      position: { x: 100, y: 1950 },
      data: { label: 'Live State Monitor', type: 'backend', url: 'http://localhost:3113/states' },
      parentNode: 'grp-backend', extent: 'parent'
    },

    // Robust Service Blocks & Bridges
    {
      id: 'svc-event-bus',
      type: 'serviceNode',
      position: { x: 1300, y: 400 },
      data: {
        label: 'iii Event Bus (Rust)',
        type: 'backend',
        icon: <Radio size={20} />,
        description: 'The high-concurrency event router handling all IPC between modules and external clients.'
      },
      parentNode: 'grp-backend', extent: 'parent'
    },
    {
      id: 'svc-worker-pool',
      type: 'serviceNode',
      position: { x: 1300, y: 800 },
      data: {
        label: 'Task Worker Pool',
        type: 'backend',
        icon: <Cpu size={20} />,
        description: 'Dynamically scales execution units for background jobs and step-based workflows.'
      },
      parentNode: 'grp-backend', extent: 'parent'
    },
    {
      id: 'svc-otel-collector',
      type: 'serviceNode',
      position: { x: 1300, y: 1200 },
      data: {
        label: 'OTEL Trace Collector',
        type: 'backend',
        icon: <Activity size={20} />,
        description: 'Aggregates telemetry, metrics, and logs for real-time observability in the console.'
      },
      parentNode: 'grp-backend', extent: 'parent'
    },

    // Robust API Endpoints
    {
      id: 'api-list-tickets',
      type: 'apiNode',
      position: { x: 1800, y: 500 },
      data: { label: '/tickets', method: 'GET', type: 'api' },
      parentNode: 'grp-backend', extent: 'parent'
    },
    {
      id: 'api-create-ticket',
      type: 'apiNode',
      position: { x: 1800, y: 750 },
      data: { label: '/tickets', method: 'POST', type: 'api' },
      parentNode: 'grp-backend', extent: 'parent'
    },

    // --- DATABASE NODES ---
    {
      id: 'db-kv-tickets',
      type: 'dbTableNode',
      position: { x: 100, y: 100 },
      data: {
        label: 'KV Store: tickets',
        type: 'database',
        rows: [
          { key: 'id', val: 'PK (uuid)' },
          { key: 'customer', val: 'string' },
          { key: 'status', val: 'enum' },
          { key: 'priority', val: 'enum' },
          { key: 'created_at', val: 'iso8601' }
        ]
      },
      parentNode: 'grp-database', extent: 'parent'
    },
    {
      id: 'db-kv-config',
      type: 'dbTableNode',
      position: { x: 600, y: 100 },
      data: {
        label: 'KV Store: flow_config',
        type: 'database',
        rows: [
          { key: 'flow_id', val: 'string' },
          { key: 'version', val: 'semver' },
          { key: 'graph_data', val: 'jsonb' }
        ]
      },
      parentNode: 'grp-database', extent: 'parent'
    }
  ];

  const edges: Edge[] = [
    // Dashboard -> API
    {
      id: 'e-dash-api',
      source: 'node-fe-dashboard', sourceHandle: 'right',
      target: 'api-list-tickets', targetHandle: 'in',
      animated: true,
      style: { stroke: 'var(--accent-blue)', strokeWidth: 4 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent-blue)' }
    },
    // API -> Event Bus
    {
      id: 'e-api-bus',
      source: 'api-list-tickets', sourceHandle: 'out',
      target: 'svc-event-bus', targetHandle: 'left',
      animated: true,
      label: 'Dispatch',
      style: { stroke: 'var(--accent-purple)' }
    },
    // Event Bus -> Worker
    {
      id: 'e-bus-worker',
      source: 'svc-event-bus', sourceHandle: 'bottom',
      target: 'svc-worker-pool', targetHandle: 'top',
      animated: true,
      style: { stroke: 'var(--accent-purple)', strokeDasharray: '5,5' }
    },
    // Worker -> DB
    {
      id: 'e-worker-db',
      source: 'svc-worker-pool', sourceHandle: 'right',
      target: 'db-kv-tickets', targetHandle: 'left',
      animated: true,
      style: { stroke: 'var(--accent-emerald)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent-emerald)' }
    },
    // Console Navigation
    {
      id: 'e-console-bridge',
      source: 'node-be-flow', sourceHandle: 'bottom',
      target: 'node-be-functions', targetHandle: 'top',
      label: 'Logic Schema',
      style: { stroke: 'rgba(255,255,255,0.1)' }
    },
    // OTEL Collector -> Logs Page
    {
      id: 'e-otel-logs',
      source: 'svc-otel-collector', sourceHandle: 'left',
      target: 'node-be-functions', targetHandle: 'right',
      label: 'Observability',
      animated: true,
      style: { stroke: 'var(--accent-emerald)' }
    }
  ];

  return { nodes, edges };
};

function App() {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => generateInitialData(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  return (
    <div className="app-layout">
      {/* Sidebar from sketch */}
      <aside className="sidebar">
        <div className="sidebar-logo shadow-glow">
          <Layers size={22} color="white" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active"><Home size={20} /></div>
          <div className="nav-item"><Workflow size={20} /></div>
          <div className="nav-item"><Database size={20} /></div>
          <div className="nav-item"><Activity size={20} /></div>
          <div className="nav-item"><Settings size={20} /></div>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" style={{ marginBottom: 12, opacity: 0.4 }}><HelpCircle size={18} /></div>
          <div className="add-button">
            <Plus size={20} />
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="canvas-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.02}
          maxZoom={1.5}
        >
          <Background color="#050608" gap={100} size={1} />
          <Controls />
          <MiniMap
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-glass)',
              right: 24, bottom: 24, borderRadius: 12
            }}
            nodeColor={(n: any) => {
              if (n.type === 'groupNode') return 'transparent';
              if (n.data.type === 'frontend') return 'var(--accent-blue)';
              if (n.data.type === 'backend') return 'var(--accent-purple)';
              if (n.data.type === 'database') return 'var(--accent-emerald)';
              if (n.data.type === 'api') return '#f3f724';
              return '#333';
            }}
            maskColor="rgba(0,0,0,0.85)"
          />

          <Panel position="top-right" className="glass" style={{ margin: 24, padding: '12px 24px', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <LegendItem color="var(--accent-blue)" label="Frontend" />
              <LegendItem color="var(--accent-purple)" label="Engine Core" />
              <LegendItem color="var(--accent-emerald)" label="Persistence" />
              <LegendItem color="#f3f724" label="API Endpoint" />
            </div>
          </Panel>
        </ReactFlow>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .shadow-glow { box-shadow: 0 0 25px rgba(59, 130, 246, 0.5); }
        .status-dot-active {
            width: 8px; height: 8px; border-radius: 50%;
            background: #10b981; margin-left: auto;
            box-shadow: 0 0 10px #10b981;
        }
        .element-icon {
            width: 44px; height: 44px; border-radius: 12px;
            display: flex; alignItems: center; justifyContent: center;
        }
        .api-node {
            width: 280px; background: #000; border: 1px solid #333;
            border-left: 5px solid #f3f724; border-radius: 6px; padding: 12px 16px;
        }
        .api-method { font-size: 9px; font-weight: 900; color: #f3f724; margin-bottom: 2px; }
        .api-path { font-family: 'Fira Code', monospace; font-size: 11px; color: #eee; }
      `}} />
    </div>
  );
}

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }}></div>
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
  </div >
);

export default App;
