import React, { useState, useEffect, useRef } from "react";
import { Activity, Terminal, Play, Loader2, ChevronRight, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { SmartMathText } from "./SmartMathText"; // Reuse your math parser

// --- Recursive Node Renderer ---
const TraceNode = ({ node, depth = 0, onInspect }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Styles based on node type
    // We expect node.type to be one of our internal mapped types: 
    // "workflow" (subagent), "text" (standard msg), "tool_request", "tool_execution", "tool_summary"

    // Icon mapping
    const getIcon = () => {
        switch (node.type) {
            case "workflow": return <Activity size={14} className="text-purple-600" />;
            case "TextMessage": return <Terminal size={14} className="text-blue-600" />;
            case "ToolCallRequestEvent": return <Play size={14} className="text-orange-500" />;
            case "ToolCallExecutionEvent": return <CheckCircle2 size={14} className="text-green-600" />;
            case "ToolCallSummaryMessage": return <CheckCircle2 size={14} className="text-green-600" />;
            default: return <AlertCircle size={14} className="text-gray-400" />;
        }
    };

    const title = node.name || node.type;
    const borderClass = depth > 0 ? "border-l-2 border-gray-100 pl-3 ml-1" : "";

    // Heuristic for simple one-line preview
    const getPreview = () => {
        if (typeof node.content === 'string') return node.content.slice(0, 50);
        if (Array.isArray(node.content)) return `[${node.content.length} items]`;
        return JSON.stringify(node.content)?.slice(0, 50) || "";
    };

    return (
        <div className={`mb-3 ${borderClass} animate-in fade-in duration-500`}>
            {/* Node Header */}
            <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded select-none group"
                onClick={(e) => {
                    // If clicking the expand icon area, toggle expand
                    // If clicking the body, inspect
                    // Simplified: Body click = toggle, but we add an inspect button
                    setIsExpanded(!isExpanded);
                }}
            >
                <span className="text-gray-400">
                    {node.children && node.children.length > 0 ? (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : <div className="w-3.5" />}
                </span>

                {getIcon()}

                <span className={`text-sm font-semibold flex-1 ${node.type === "workflow" ? "text-purple-700" : "text-gray-700"}`}>
                    {title}
                </span>

                <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-xs text-gray-500"
                    onClick={(e) => {
                        e.stopPropagation();
                        onInspect(node);
                    }}
                >
                    Inspect
                </button>
            </div>

            {/* Node Content Preview (Collapsed state or just always visible if expanded?) */}
            {isExpanded && (
                <div className="mt-1 ml-6 text-sm text-gray-800">
                    {/* Render minimal content or just children */}
                    <div
                        className="text-xs text-gray-500 truncate mb-2 font-mono bg-gray-50 p-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => onInspect(node)}
                    >
                        {getPreview()}
                    </div>

                    {/* Recursive Children */}
                    {node.children && node.children.map((child, idx) => (
                        <TraceNode key={child.id || idx} node={child} depth={depth + 1} onInspect={onInspect} />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Helper: Transform AgentWork/ChatLog to Trace Nodes ---
const parseMsg = (rawMsg) => {
    try {
        return typeof rawMsg === 'string' ? JSON.parse(rawMsg) : rawMsg;
    } catch (e) {
        return { type: 'TextMessage', content: String(rawMsg), source: 'unknown' };
    }
};

const transformChatLog = (chatLog, parentId = "root") => {
    if (!chatLog) return [];

    // 1. Process Messages
    const msgNodes = (chatLog.msgs || []).map((rawM, idx) => {
        const msg = parseMsg(rawM);
        // Common structure from user example:
        // { id, source, type, content, ... }

        return {
            id: msg.id || `${parentId}-msg-${idx}`,
            type: msg.type || "TextMessage",
            name: `${msg.source} (${msg.type})`,
            content: msg.content,
            fullData: msg, // Keep full parsed object for inspector
            children: []
        };
    });

    // 2. Process Subagents
    const subNodes = (chatLog.subagents_logs || []).map((subLog, idx) => {
        return {
            id: `${parentId}-sub-${idx}`,
            type: "workflow",
            name: "Subagent Execution",
            content: "Use inspector to view details",
            fullData: subLog,
            children: transformChatLog(subLog, `${parentId}-sub-${idx}`)
        };
    });

    return [...msgNodes, ...subNodes];
};


// --- Inspector Modal ---
const NodeInspector = ({ node, onClose }) => {
    if (!node) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col font-sans">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="font-bold text-gray-700">{node.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-black hover:bg-gray-200 rounded-full p-1 transition-all">
                        <ChevronRight className="rotate-90" size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-gray-50/50">
                    <div className="bg-white border border-gray-200 rounded p-4 font-mono text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(node.fullData || node.content, null, 2)}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Monitor Component ---
export default function TraceMonitor({ isActive, onStartProblem }) {
    const [problem, setProblem] = useState("");
    const [traceData, setTraceData] = useState([]);
    const [status, setStatus] = useState("idle");
    const [inspectNode, setInspectNode] = useState(null);
    const scrollRef = useRef(null);

    // Smart Auto-scroll: Only scroll if we were already near the bottom
    useEffect(() => {
        if (scrollRef.current && !inspectNode) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Tolerance of 100px
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

            // If this is the initial load (traceData just populated from empty), or if user is near bottom
            if (isNearBottom || traceData.length < 5) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [traceData, inspectNode]);

    // Polling Logic
    useEffect(() => {
        if (!isActive) return;

        const poll = async () => {
            try {
                const res = await fetch(`http://localhost:8080/get_status`);
                if (!res.ok) throw new Error("Network response was not ok");
                const agentWork = await res.json();

                if (agentWork && agentWork.log) {
                    const nodes = transformChatLog(agentWork.log);
                    // Simple optimization: only update if length changed or strict inequality
                    // Ideally we'd deep compare, but to fix the "flash" we can just check length for now
                    // or just rely on the smart scroll fix above.
                    setTraceData(nodes);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        };

        poll();
        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [isActive]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setTraceData([]);
        try {
            const res = await fetch("http://localhost:8080/set_problem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "problem": problem, "use_lit_review": false })
            });
            await res.json();
            onStartProblem();
            setStatus("active");
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-white border-r border-gray-200 font-sans relative overflow-hidden min-w-0">
            <NodeInspector node={inspectNode} onClose={() => setInspectNode(null)} />

            {/* Header / Input Area */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mission Control</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">

                    {/* Unified Input Box */}
                    <div className="border border-gray-300 rounded bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                        <textarea
                            className="w-full text-sm p-3 outline-none resize-none bg-transparent min-h-[60px] max-h-[300px]"
                            rows={1}
                            placeholder="Enter mathematical problem (LaTeX supported)..."
                            value={problem}
                            onChange={(e) => {
                                setProblem(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />

                        {/* Live Math Preview */}
                        {problem && (
                            <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50/50">
                                <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Preview</div>
                                <div className="text-sm text-gray-700">
                                    <SmartMathText text={problem} />
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading" || !problem}
                        className="flex items-center justify-center gap-2 bg-black text-white text-xs font-bold py-2 rounded hover:bg-gray-800 disabled:opacity-50 transition-all mt-1"
                    >
                        {status === "loading" ? <Loader2 className="animate-spin" size={12} /> : <Play size={12} />}
                        INITIATE AGENTS
                    </button>
                </form>
            </div>

            {/* Scrollable Trace Area */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 min-w-0 overscroll-contain" ref={scrollRef}>
                {traceData.length === 0 && status === "active" && (
                    <div className="text-center text-gray-400 mt-10 text-sm animate-pulse">
                        Waiting for agent heartbeat...
                    </div>
                )}

                {traceData.map((node) => (
                    <TraceNode key={node.id} node={node} onInspect={setInspectNode} />
                ))}

                {status === "idle" && traceData.length === 0 && (
                    <div className="text-center text-gray-300 mt-20 text-sm">
                        Ready to solve.
                    </div>
                )}
            </div>

            {/* Status Footer */}
            <div className="p-2 bg-gray-100 border-t border-gray-200 text-[10px] text-gray-500 flex justify-between">
                <span>Mode: {isActive ? "ACTIVE" : "IDLE"}</span>
                <span className="flex items-center gap-1">
                    {isActive ? <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> : <span className="w-2 h-2 bg-gray-400 rounded-full" />}
                    {isActive ? "SYSTEM ONLINE" : "STANDBY"}
                </span>
            </div>
        </div>
    );
}