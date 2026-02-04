'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { AIAssistant } from './AIAssistant'

interface AIContextType {
    setContext: (context: any) => void
    context: any
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIContextProvider({ children }: { children: ReactNode }) {
    const [context, setContext] = useState<any>(undefined)

    return (
        <AIContext.Provider value={{ context, setContext }}>
            {children}
            <AIAssistant context={context} />
        </AIContext.Provider>
    )
}

export function useAI() {
    const context = useContext(AIContext)
    if (context === undefined) {
        throw new Error('useAI must be used within an AIContextProvider')
    }
    return context
}
