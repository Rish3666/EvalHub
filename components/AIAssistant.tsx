'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, MessageSquare, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface AIAssistantProps {
    context?: {
        repositoryName?: string
        qualityScore?: number
        qualityBreakdown?: Record<string, number>
        languages?: Record<string, number>
    }
}

export function AIAssistant({ context }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        // Keyboard shortcut: Cmd+K or Ctrl+K
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(prev => !prev)
            }
        }

        // Add event listener with capture phase to catch it before other handlers
        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [])

    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus()
        }
    }, [isOpen, isMinimized])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    context: context,
                    history: messages.slice(-5) // Last 5 messages for context
                })
            })

            if (!response.ok) throw new Error('Failed to get response')

            const data = await response.json()
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('AI Assistant error:', error)
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const suggestedQuestions = [
        'Explain my quality score',
        'What tech should I learn?',
        'How to improve backend?',
        'Why is test coverage 0%?'
    ]

    const handleSuggestedQuestion = (question: string) => {
        setInput(question)
        inputRef.current?.focus()
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-white text-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
                aria-label="Open AI Assistant"
            >
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
        )
    }

    return (
        <div className={cn(
            "fixed right-6 z-50 bg-black border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] transition-all",
            isMinimized ? "bottom-6 w-80" : "bottom-6 w-96 h-[600px]"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-white/20 bg-black">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-white" />
                    <div>
                        <h3 className="text-sm font-black tracking-widest uppercase text-white">AI_ASSISTANT</h3>
                        <p className="text-[9px] text-gray-500 tracking-wider uppercase">Tech Guidance</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-white/10 transition-colors"
                        aria-label={isMinimized ? "Maximize" : "Minimize"}
                    >
                        {isMinimized ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(600px-180px)] custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                <MessageSquare className="w-16 h-16 text-white/20" />
                                <div>
                                    <p className="text-sm font-bold text-white/60 uppercase tracking-wider mb-2">Ask me anything</p>
                                    <p className="text-xs text-gray-500">I'll help you understand your code quality and what to learn next</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {suggestedQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestedQuestion(q)}
                                            className="text-[10px] p-2 border border-white/20 hover:bg-white hover:text-black transition-all uppercase tracking-wide font-mono"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex gap-3",
                                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] p-3 font-mono text-xs",
                                            msg.role === 'user'
                                                ? 'bg-white text-black border-2 border-black'
                                                : 'bg-white/5 text-white border border-white/20'
                                        )}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        <p className="text-[9px] text-gray-500 mt-2 uppercase tracking-wider">
                                            {msg.timestamp.toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="bg-white/5 text-white border border-white/20 p-3 font-mono text-xs">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t-2 border-white/20 bg-black">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about your code quality..."
                                className="flex-1 bg-white/5 border border-white/20 text-white px-3 py-2 text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="bg-white text-black px-4 py-2 border-2 border-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Send message"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[9px] text-gray-600 mt-2 uppercase tracking-wider">Press Cmd+K to toggle</p>
                    </div>
                </>
            )}
        </div>
    )
}
