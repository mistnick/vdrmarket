'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export function Terminal() {
    const [terminalStep, setTerminalStep] = useState(0);
    const [copied, setCopied] = useState(false);
    const terminalSteps = [
        '$ dataroom upload pitch-deck.pdf',
        '✓ Document uploaded securely',
        '$ dataroom create-link --expire 7d',
        '✓ Share link: https://dr.co/abc123',
        '$ dataroom analytics',
        '✓ 47 views · 12 visitors · 3.2min avg',
        '$ dataroom create-room "Series A"',
        '✓ Data room created 🎉',
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setTerminalStep((prev) =>
                prev < terminalSteps.length - 1 ? prev + 1 : prev
            );
        }, 600);

        return () => clearTimeout(timer);
    }, [terminalStep, terminalSteps.length]);

    const copyToClipboard = () => {
        const commands = terminalSteps.filter(step => step.startsWith('$'));
        navigator.clipboard.writeText(commands.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full rounded-lg shadow-2xl overflow-hidden bg-gray-900 text-white font-mono text-sm relative">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Copy to clipboard"
                    >
                        {copied ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            <Copy className="h-5 w-5" />
                        )}
                    </button>
                </div>
                <div className="space-y-2">
                    {terminalSteps.map((step, index) => (
                        <div
                            key={index}
                            className={`${index > terminalStep ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                        >
                            {step.startsWith('$') ? (
                                <><span className="text-emerald-400">$</span> {step.slice(2)}</>
                            ) : (
                                <span className="text-emerald-300">{step}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
