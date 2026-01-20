import React, { useState } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import TraceMonitor from "./components/TraceMonitor";
import AutoGraph from "./components/AutoGraph";
import InspectorPanel from "./components/InspectorPanel";

export default function App() {
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [selectedGraphItem, setSelectedGraphItem] = useState(null);

  // When user clicks "Initiate Agents"
  const handleStartProblem = () => {
    setIsSystemActive(true);
    // Reset selection on new run?
    setSelectedGraphItem(null);
  };

  return (
    <div className="w-full h-full overflow-hidden text-slate-800">
      <Group direction="horizontal">

        {/* --- LEFT PANEL: AGENT MONITOR --- */}
        <Panel defaultSize={35} minSize={15}>
          <div className="h-full w-full overflow-hidden min-w-0">
            <TraceMonitor
              isActive={isSystemActive}
              onStartProblem={handleStartProblem}
            />
          </div>
        </Panel>

        <Separator className="w-[1px] bg-gray-300 hover:bg-blue-500 transition-colors" />

        {/* --- CENTER PANEL: GRAPH --- */}
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full relative">
            <AutoGraph
              isPolling={isSystemActive} // Only poll if a problem is running
              onNodeClick={setSelectedGraphItem}
            />

            {/* Floating Title */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded border border-gray-200 shadow-sm pointer-events-none">
              <h1 className="text-xs font-bold text-gray-500 uppercase">Knowledge Graph State</h1>
            </div>
          </div>
        </Panel>

        <Separator className="w-[1px] bg-gray-300 hover:bg-blue-500 transition-colors" />

        {/* --- RIGHT PANEL: INSPECTOR --- */}
        <Panel defaultSize={25} minSize={15}>
          {/* Reuse your InspectorPanel logic here */}
          <div className="h-full overflow-y-auto bg-gray-50">
            {selectedGraphItem ? (
              <InspectorPanel item={selectedGraphItem} />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm italic p-10 text-center">
                Select a node in the graph to inspect properties
              </div>
            )}
          </div>
        </Panel>

      </Group>
    </div>
  );
}