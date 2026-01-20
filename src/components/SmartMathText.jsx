import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Heuristic: Does this word look like a math term?
const isMathPattern = (text) => {
    // 1. Contains LaTeX specific chars: backslash, underscore, caret, curly braces
    if (/[\\[\]{}_^]/.test(text)) return true;

    // 2. Contains math operators: =, <, >, +, common functions like gcd, log
    if (/[=<>+]/.test(text)) return true;
    if (/^(gcd|sum|lim|min|max|log|sin|cos|tan)$/.test(text)) return true;

    return false;
};

export const SmartMathText = ({ text }) => {
    if (!text) return null;

    // Split by block delimiters: \[ ... \] OR $$ ... $$
    // We use a capturing group to include the delimiter in the result array
    const parts = text.split(/(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g);

    return (
        <span style={{ lineHeight: '1.6' }}>
            {parts.map((part, index) => {
                // Check if this part is a block match
                if (part.startsWith('\\[') && part.endsWith('\\]')) {
                    // Remove delimiters \[ and \]
                    const content = part.slice(2, -2);
                    return <BlockMath key={index} math={content} />;
                }
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    // Remove delimiters $$
                    const content = part.slice(2, -2);
                    return <BlockMath key={index} math={content} />;
                }

                // If not block, use the existing inline logic (recursion or simple handling)
                return <InlineSmartText key={index} text={part} />;
            })}
        </span>
    );
};

// Extracted internal component for the inline/heuristic logic
const InlineSmartText = ({ text }) => {
    if (!text) return null;

    // 1. If it has '$', assume it's properly formatted inline math
    if (text.includes('$')) {
        const subParts = text.split('$');
        return (
            <span>
                {subParts.map((subPart, i) =>
                    i % 2 === 1 ? <InlineMath key={i} math={subPart} /> : <span key={i}>{subPart}</span>
                )}
            </span>
        );
    }

    // 2. The "LLM Fixer" logic for plain text math heuristics
    const words = text.split(' ');
    const result = [];
    let buffer = [];

    words.forEach((word, index) => {
        const cleanWord = word.replace(/[.,;:]$/, '');
        if (isMathPattern(cleanWord)) {
            buffer.push(word);
        } else {
            if (buffer.length > 0) {
                result.push(
                    <span key={`math-${index}`} style={{ margin: "0 4px" }}>
                        <InlineMath math={buffer.join(' ')} />
                    </span>
                );
                buffer = [];
            }
            // Preserve spaces
            result.push(<span key={`text-${index}`}>{word} </span>);
        }
    });

    if (buffer.length > 0) {
        result.push(
            <span key="math-end" style={{ margin: "0 4px" }}>
                <InlineMath math={buffer.join(' ')} />
            </span>
        );
    }

    return <span>{result}</span>;
};