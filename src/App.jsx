import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, Eye, Code, CheckCircle, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
const AUTO_RENDER_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";

const App = () => {
  // Configuration State
  const [endpoint, setEndpoint] = useState('http://localhost:8080/set_problem');
  const [authHeader, setAuthHeader] = useState('');
  const [jsonKey, setJsonKey] = useState('problem');

  // Content State
  const [content, setContent] = useState('Solve for x: $x^2 + 5x + 6 = 0$');
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'json'

  // Request State
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [responseLog, setResponseLog] = useState(null);

  // Latex Loading State
  const [katexLoaded, setKatexLoaded] = useState(false);
  const previewRef = useRef(null);

  // Load KaTeX scripts dynamically
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadCSS = (href) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    loadCSS(KATEX_CSS);
    loadScript(KATEX_JS)
      .then(() => loadScript(AUTO_RENDER_JS))
      .then(() => setKatexLoaded(true))
      .catch(err => console.error("Failed to load KaTeX", err));
  }, []);

  // Render LaTeX when content or tab changes
  useEffect(() => {
    if (katexLoaded && activeTab === 'preview' && previewRef.current && window.renderMathInElement) {
      window.renderMathInElement(previewRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }, [content, activeTab, katexLoaded]);

  const handleSubmit = async () => {
    setStatus('loading');
    setResponseLog(null);

    const payload = {
      [jsonKey]: content
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    try {
      console.log(payload)
      console.log(content)
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: headers
      });

      const data = await res.json().catch(() => ({ message: 'No JSON response' }));

      if (res.ok) {
        setStatus('success');
        setResponseLog(JSON.stringify(data, null, 2));
      } else {
        setStatus('error');
        setResponseLog(`Error ${res.status}: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setStatus('error');
      setResponseLog(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800">Agent Task Dispatcher</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-md transition-colors ${showConfig ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Configuration Panel (Collapsible) */}
      {showConfig && (
        <div className="bg-gray-100 border-b border-gray-200 px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint URL</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Header (Optional)</label>
            <input
              type="text"
              placeholder="Bearer token123..."
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payload Key</label>
            <input
              type="text"
              value={jsonKey}
              onChange={(e) => setJsonKey(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left Column: Input */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white min-w-[300px]">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-xs font-medium text-gray-500 uppercase">Problem Statement (LaTeX Supported)</span>
            <span className="text-xs text-gray-400">supports $inline$ and $$block$$</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed"
            placeholder="Describe the task for the agent team..."
            spellCheck="false"
          />
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status === 'loading' && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
              {status === 'success' && <span className="flex items-center text-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4 mr-1" /> Sent</span>}
              {status === 'error' && <span className="flex items-center text-red-600 text-sm font-medium"><AlertCircle className="w-4 h-4 mr-1" /> Failed</span>}
            </div>
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className={`flex items-center space-x-2 px-6 py-2 rounded-md font-medium text-white transition-all
                ${status === 'loading' ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow'}`}
            >
              <Send className="w-4 h-4" />
              <span>Send Task</span>
            </button>
          </div>
        </div>

        {/* Right Column: Preview/Debug */}
        <div className="flex-1 flex flex-col bg-gray-50 min-w-[300px] max-h-screen overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200 bg-white flex space-x-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center space-x-1.5 transition-colors
                ${activeTab === 'preview' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Eye className="w-4 h-4" />
              <span>Visual Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center space-x-1.5 transition-colors
                ${activeTab === 'json' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Code className="w-4 h-4" />
              <span>JSON Payload</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'preview' ? (
              <div className="prose prose-indigo max-w-none">
                {/* Rendered output container */}
                <div
                  ref={previewRef}
                  className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 min-h-[200px] text-lg leading-relaxed whitespace-pre-wrap"
                >
                  {content || <span className="text-gray-300 italic">Preview will appear here...</span>}
                </div>
                {!katexLoaded && (
                  <p className="mt-2 text-xs text-amber-600">Loading math rendering engine...</p>
                )}
              </div>
            ) : (
              <div className="relative h-full">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg shadow-inner font-mono text-xs h-full overflow-auto">
                  {JSON.stringify({ [jsonKey]: content }, null, 2)}
                </pre>
              </div>
            )}

            {/* Response Log Area */}
            {responseLog && (
              <div className="mt-6 animate-in slide-in-from-bottom-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Server Response</h3>
                <pre className={`p-4 rounded-md border text-xs font-mono overflow-auto max-h-40
                   ${status === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                  {responseLog}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;