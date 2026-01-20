import React from "react";
import { InlineMath } from 'react-katex';
import { SmartMathText } from './SmartMathText';
import 'katex/dist/katex.min.css';

export default function InspectorPanel({ item }) {
    if (!item) return null;

    const isLink = item.source !== undefined && item.target !== undefined;
    const typeLabel = isLink ? "Implication Edge" : "Statement Node";

    // Fields handled manually at top
    const manualFields = ["human_rep", "uid", "labels", "tags", "embedding"];
    // Fields to ignore completely
    const ignoreKeys = ["id", "x", "y", "vx", "vy", "index", "source", "target", "color", "val", "__indexColor", "verification"];

    return (
        <div style={{ padding: "24px", fontFamily: '"Times New Roman", Times, serif', color: "#333" }}>

            {/* 1. Header Area */}
            <div style={{ borderBottom: "2px solid #333", paddingBottom: "16px", marginBottom: "20px" }}>
                <div style={{
                    fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.2px",
                    color: "#666", marginBottom: "4px", fontFamily: "Arial, sans-serif"
                }}>
                    {typeLabel}
                </div>
                <h2 style={{ margin: "0 0 8px 0", fontSize: "1.4rem", fontWeight: "bold", wordBreak: "break-all" }}>
                    {item.uid || "Unknown ID"}
                </h2>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                        {item.tags.map(tag => (
                            <span key={tag} style={{
                                background: "#e9ecef", color: "#495057", border: "1px solid #ced4da",
                                fontSize: "11px", padding: "2px 8px", borderRadius: "12px", fontFamily: "Arial"
                            }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Featured Property: Human Representation (Math) */}
            {item.human_rep && (
                <div style={{ marginBottom: "24px", background: "#fff", border: "1px solid #e0e0e0", padding: "16px", borderRadius: "4px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#999", textTransform: "uppercase", marginBottom: "8px", fontFamily: "Arial" }}>
                        Human Representation
                    </div>
                    <div style={{ fontSize: "16px", lineHeight: "1.6", color: "#222" }}>
                        {/* REPLACED: Use the Smart Parser */}
                        <SmartMathText text={item.human_rep} />
                    </div>
                </div>
            )}

            {/* 3. General Properties Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <tbody>
                    {/* Special handling for Embedding */}
                    {item.embedding && (
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "8px 0", color: "#666", width: "30%", verticalAlign: "top" }}>EMBEDDING</td>
                            <td style={{ padding: "8px 0", fontFamily: "monospace", color: "#555" }}>
                                [{item.embedding.slice(0, 3).join(", ")} ... {item.embedding.length} dims]
                            </td>
                        </tr>
                    )}

                    {/* Remaining Properties */}
                    {Object.entries(item).map(([key, value]) => {
                        if (manualFields.includes(key) || ignoreKeys.includes(key)) return null;
                        if (value === null || value === undefined) return null;

                        return (
                            <tr key={key} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "8px 0", color: "#666", width: "30%", verticalAlign: "top", textTransform: "uppercase", fontSize: "11px", fontFamily: "Arial" }}>
                                    {key.replace(/_/g, " ")}
                                </td>
                                <td style={{ padding: "8px 0 8px 12px" }}>
                                    {/* Simple Math detection for property values */}
                                    {typeof value === 'string' && (value.includes('$'))
                                        ? <InlineMath math={value.replace(/\$/g, '')} />
                                        : value.toString()
                                    }
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
