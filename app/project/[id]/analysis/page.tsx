'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionCard } from '@/components/QuestionCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Question {
    id: number;
    question: string;
    category: string;
    expectedDepth: string;
}

export default function AnalysisPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: projectIdFromParams } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [projectId, setProjectId] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<
        Record<
            number,
            { text: string; timeSpent: number; skipped: boolean }
        >
    >({});
    const [loading, setLoading] = useState(true);

    const fetchQuestions = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/projects/${id}/questions`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setQuestions(data.questions);
        } catch (error: any) {
            toast({
                title: 'Error loading questions',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        setProjectId(projectIdFromParams);
        fetchQuestions(projectIdFromParams);
    }, [projectIdFromParams, fetchQuestions]);

    async function handleNext(answer: string, timeSpent: number) {
        // Save answer
        setAnswers((prev) => ({
            ...prev,
            [currentIndex]: { text: answer, timeSpent, skipped: false },
        }));

        // Auto-save to backend
        await fetch(`/api/projects/${projectId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionId: questions[currentIndex].id,
                answer,
                timeSpent,
                isSkipped: false,
            }),
        });

        if (currentIndex === questions.length - 1) {
            // Last question - generate scorecard
            router.push(`/project/${projectId}/scorecard?generate=true`);
        } else {
            setCurrentIndex((prev) => prev + 1);
        }
    }

    function handlePrevious() {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
    }

    async function handleSkip() {
        setAnswers((prev) => ({
            ...prev,
            [currentIndex]: { text: '', timeSpent: 0, skipped: true },
        }));

        await fetch(`/api/projects/${projectId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionId: questions[currentIndex].id,
                isSkipped: true,
            }),
        });

        if (currentIndex === questions.length - 1) {
            router.push(`/project/${projectId}/scorecard?generate=true`);
        } else {
            setCurrentIndex((prev) => prev + 1);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">No questions available</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
            <QuestionCard
                question={questions[currentIndex]}
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSkip={handleSkip}
                initialAnswer={answers[currentIndex]?.text}
            />
        </div>
    );
}
