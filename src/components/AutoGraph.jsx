import React, { useEffect, useState, useRef, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import neo4j from "neo4j-driver";
import { transformPolymathData } from "../utils/graphUtils";

// --- Driver Setup ---
// NOTE: In a real app, you might want to move this to a context or service
const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("neo4j", "let_me_in_please")
);

export default function AutoGraph({ isPolling, onNodeClick }) {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [selectedItem, setSelectedItem] = useState(null);
    const graphRef = useRef();

    // Polling Effect
    useEffect(() => {
        let intervalId;

        const fetchGraph = async () => {
            const session = driver.session();
            try {
                const query = `
          MATCH (source:Statement)
          OPTIONAL MATCH (source)-[:HAS_TAG]->(t:Tag)
          WITH source, collect(t.name) as sourceTags
          OPTIONAL MATCH (source)-[:IS_PREMISE]->(imp:Implication)-[:IS_PROOF]->(target:Statement)
          RETURN source, sourceTags, imp, target
        `;
                const result = await session.run(query);
                const data = transformPolymathData(result);

                // Only update state if data size changed (simple optimization) to avoid jitter
                setGraphData(prev => {
                    if (prev.nodes.length !== data.nodes.length || prev.links.length !== data.links.length) {
                        return data;
                    }
                    return prev; // Or return data if you want property updates to reflect immediately
                });
            } catch (error) {
                console.error("Neo4j Error:", error);
            } finally {
                await session.close();
            }
        };

        fetchGraph(); // Initial fetch

        if (isPolling) {
            intervalId = setInterval(fetchGraph, 3000); // Poll every 3 seconds
        }

        return () => clearInterval(intervalId);
    }, [isPolling]);

    // Handle local selection + prop callback
    const handleNodeClick = (node) => {
        setSelectedItem(node);
        if (onNodeClick) onNodeClick(node);
    };

    const handleLinkClick = (link) => {
        setSelectedItem(link);
        if (onNodeClick) onNodeClick(link);
    };

    // --- Scientific Node Painter ---
    const paintNode = useCallback((node, ctx, globalScale) => {
        const isSelected = selectedItem && selectedItem.id === node.id && !selectedItem.source;
        const nodeSize = 5;

        // 1. Selection Ring (Subtle Blue Halo)
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize + 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgba(0, 123, 255, 0.2)";
            ctx.fill();
            ctx.strokeStyle = "#007bff";
            ctx.lineWidth = 1 / globalScale;
            ctx.stroke();
        }

        // 2. Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color;
        ctx.fill();

        // 3. Crisp Border (Scientific look)
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1.0 / globalScale;
        ctx.stroke();

        // 4. Label (Only on zoom/hover/select)
        if (globalScale > 2 || isSelected) {
            const label = node.uid || node.id;
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px "Times New Roman", Serif`; // Serif font for scientific feel
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#000";
            ctx.fillText(label, node.x, node.y + nodeSize + 2);
        }
    }, [selectedItem]);

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                backgroundColor="#ffffff" // Scientific White
                width={undefined} // Let it auto-size to parent
                height={undefined}

                // Nodes
                nodeCanvasObject={paintNode}
                onNodeClick={handleNodeClick}

                // Links
                linkColor={(link) => link.color || "#999"}
                linkWidth={(link) => (selectedItem === link ? 3 : 1)}
                linkDirectionalArrowLength={3.5}
                linkDirectionalParticles={selectedItem ? 4 : 0}
                linkDirectionalParticleWidth={2}
                onLinkClick={handleLinkClick}

                // Controls
                minZoom={0.5}
                maxZoom={10}
            />

            {/* Overlay Legend */}
            <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.9)", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "12px", fontFamily: "Arial, sans-serif", pointerEvents: 'none' }}>
                <b>Verification Levels</b>
                <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                    <span style={{ color: "#2ecc71" }}>● Verified</span>
                    <span style={{ color: "#e74c3c" }}>● Rejected</span>
                    <span style={{ color: "#f1c40f" }}>● Speculative</span>
                </div>
            </div>
        </div>
    );
}
