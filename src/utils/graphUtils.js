// utils/graphUtils.js

// Map your VerificationLevel enum to colors
export const VERIFICATION_COLORS = {
    0: "#e74c3c", // REJECTED (Red)
    1: "#f1c40f", // SPECULATIVE (Yellow)
    2: "#3498db", // NUMERICAL (Blue)
    3: "#9b59b6", // FORMAL_SKETCH (Purple)
    4: "#2ecc71", // VERIFIED (Green)
};

export const getVerificationColor = (level) => {
    return VERIFICATION_COLORS[level] || "#95a5a6"; // Default Grey
};

// Transform Neo4j data into { nodes, links }
// "Collapses" Implication nodes into links
export const transformPolymathData = (result) => {
    const nodesMap = new Map();
    const links = [];

    result.records.forEach((record) => {
        // 1. Process the Source Node (Statement)
        const sourceNode = record.get("source");
        const sourceTags = record.get("sourceTags");

        if (sourceNode && !nodesMap.has(sourceNode.identity.toNumber())) {
            nodesMap.set(sourceNode.identity.toNumber(), {
                id: sourceNode.identity.toNumber(),
                ...sourceNode.properties,
                labels: sourceNode.labels, // e.g., ["Statement"]
                tags: sourceTags || [],    // From OPTIONAL MATCH
                // Visual props
                color: getVerificationColor(sourceNode.properties.verification?.toNumber()),
                val: 5 // Size
            });
        }

        // 2. Process the Target Node (Statement) - if it exists
        const targetNode = record.get("target");
        if (targetNode && !nodesMap.has(targetNode.identity.toNumber())) {
            nodesMap.set(targetNode.identity.toNumber(), {
                id: targetNode.identity.toNumber(),
                ...targetNode.properties,
                labels: targetNode.labels,
                tags: [], // Target tags might need a separate fetch or improved query
                color: getVerificationColor(targetNode.properties.verification?.toNumber()),
                val: 5
            });
        }

        // 3. Process the Implication (The "Edge")
        const implication = record.get("imp");
        if (implication && sourceNode && targetNode) {
            links.push({
                source: sourceNode.identity.toNumber(),
                target: targetNode.identity.toNumber(),
                // IMPORTANT: We store the Implication Node's properties on the link!
                ...implication.properties,
                type: "IMPLICATION",
                id: implication.identity.toNumber(), // Keep ID for React keys
                color: getVerificationColor(implication.properties.verification?.toNumber())
            });
        }
    });

    return {
        nodes: Array.from(nodesMap.values()),
        links: links
    };
};