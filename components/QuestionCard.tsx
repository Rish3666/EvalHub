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
        <div className="max-w-3xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="mb-6">
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
                <Progress value={progress} className="h-2" />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Badge variant="outline">{question.category}</Badge>
                    </div>
                    <CardTitle className="text-xl mt-4">{question.question}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Write your answer here... (minimum 50 characters)"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="min-h-[200px] text-base"
                        maxLength={maxChars}
                    />

                    <div className="flex justify-between items-center text-sm">
                        <span
                            className={
                                charCount < minChars
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                            }
                        >
                            {charCount}/{maxChars} characters{' '}
                            {charCount < minChars && `(${minChars - charCount} more needed)`}
                        </span>
                    </div>

                    {/* Optional Hint */}
                    {!showHint ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHint(true)}
                            className="gap-2"
                        >
                            <Lightbulb className="h-4 w-4" />
                            Show hint (affects score)
                        </Button>
                    ) : (
                        <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                {question.expectedDepth}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={onPrevious}
                        disabled={currentIndex === 0}
                    >
                        Previous
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onSkip}>
                            Skip Question
                        </Button>

                        <Button
                            onClick={() => onNext(answer, timeSpent)}
                            disabled={!isValid && answer.length > 0}
                        >
                            {currentIndex === totalQuestions - 1
                                ? 'Finish'
                                : 'Next Question →'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
