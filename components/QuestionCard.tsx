'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, Clock } from 'lucide-react';

interface Question {
    id: number;
    question: string;
    category: string;
    expectedDepth: string;
}

interface QuestionCardProps {
    question: Question;
    currentIndex: number;
    totalQuestions: number;
    onNext: (answer: string, timeSpent: number) => void;
    onPrevious: () => void;
    onSkip: () => void;
    initialAnswer?: string;
}

export function QuestionCard({
    question,
    currentIndex,
    totalQuestions,
    onNext,
    onPrevious,
    onSkip,
    initialAnswer = '',
}: QuestionCardProps) {
    const [answer, setAnswer] = useState(initialAnswer);
    const [timeSpent, setTimeSpent] = useState(0);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTimeSpent((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const charCount = answer.length;
    const minChars = 50;
    const maxChars = 500;
    const isValid = charCount >= minChars && charCount <= maxChars;

    const progress = ((currentIndex + 1) / totalQuestions) * 100;

    return (
        <div className="flex flex-col">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/50 mb-6">
                <h1 className="text-xl font-bold flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onPrevious} disabled={currentIndex === 0} className="rounded-full">
                        ←
                    </Button>
                    Analysis
                </h1>
            </div>

            <div className="px-4 space-y-6">
                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>
                            Question {currentIndex + 1} of {totalQuestions}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.floor(timeSpent / 60)}:
                            {(timeSpent % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                    <Progress value={progress} className="h-1" />
                </div>

                <Card className="border-border/50 overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none">{question.category}</Badge>
                        </div>
                        <CardTitle className="text-xl mt-2 leading-tight">{question.question}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Write your answer here... (minimum 50 characters)"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="min-h-[200px] text-lg bg-transparent border-none focus-visible:ring-0 p-0 resize-none"
                            maxLength={maxChars}
                        />

                        <div className="flex justify-between items-center text-sm border-t border-border/50 pt-4">
                            <span
                                className={
                                    charCount < minChars
                                        ? 'text-destructive'
                                        : 'text-muted-foreground font-medium'
                                }
                            >
                                {charCount}/{maxChars} {charCount < minChars && `(need ${minChars - charCount} more)`}
                            </span>

                            {/* Optional Hint */}
                            {!showHint ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowHint(true)}
                                    className="gap-2 rounded-full text-primary hover:bg-primary/10"
                                >
                                    <Lightbulb className="h-4 w-4" />
                                    Hint
                                </Button>
                            ) : (
                                <div className="text-xs text-primary font-medium flex items-center gap-1">
                                    <Lightbulb className="h-3 w-3" />
                                    Hint used
                                </div>
                            )}
                        </div>

                        {showHint && (
                            <Alert className="bg-primary/5 border-primary/20 rounded-xl">
                                <AlertDescription className="text-sm">
                                    {question.expectedDepth}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between bg-muted/5 py-3 border-t border-border/50">
                        <Button variant="ghost" onClick={onSkip} className="rounded-full">
                            Skip
                        </Button>

                        <Button
                            onClick={() => onNext(answer, timeSpent)}
                            disabled={!isValid && answer.length > 0}
                            className="rounded-full px-8"
                        >
                            {currentIndex === totalQuestions - 1
                                ? 'Finish'
                                : 'Next'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
