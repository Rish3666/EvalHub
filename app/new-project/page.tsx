"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Github, Loader2 } from "lucide-react";

export default function NewProjectPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        repo_url: "",
        description: "",
        tech_stack: "",
        challenge: "",
        solution: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast({
                    title: "Authentication Required",
                    description: "Please sign in to create a project.",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            // 2. Insert project
            const { data: project, error } = await supabase
                .from("projects")
                .insert({
                    user_id: user.id,
                    title: formData.title,
                    repo_url: formData.repo_url,
                    description: formData.description,
                    tech_stack: formData.tech_stack.split(",").map(t => t.trim()).filter(Boolean),
                    challenge: formData.challenge,
                    solution: formData.solution,
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Project Created!",
                description: "Starting AI analysis...",
            });

            // 3. Trigger AI Analysis
            const analysisRes = await fetch(`/api/projects/${project.id}/analyze`, {
                method: "POST",
            });

            const analysisData = await analysisRes.json();

            if (!analysisRes.ok) {
                throw new Error(analysisData.error || "Failed to start analysis");
            }

            // 4. Redirect to Q&A
            router.push(`/project/${project.id}/analysis`);
        } catch (error: any) {
            console.error("Error creating project:", error);
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Analyze New Project</CardTitle>
                    <CardDescription>
                        Submit your GitHub repository and tell us about the project. Our AI will analyze your code and prepare a personalized skill assessment.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. My Awesome Portfolio"
                                required
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="repo_url">GitHub Repository URL</Label>
                            <div className="relative">
                                <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="repo_url"
                                    name="repo_url"
                                    className="pl-10"
                                    placeholder="https://github.com/username/repo"
                                    required
                                    type="url"
                                    value={formData.repo_url}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tech_stack">Tech Stack (comma separated)</Label>
                            <Input
                                id="tech_stack"
                                name="tech_stack"
                                placeholder="Next.js, TypeScript, Supabase, Tailwind"
                                required
                                value={formData.tech_stack}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Short Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="What does this project do?"
                                required
                                className="min-h-[100px]"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="challenge">Top Technical Challenge</Label>
                                <Textarea
                                    id="challenge"
                                    name="challenge"
                                    placeholder="What was the hardest part to build?"
                                    className="min-h-[120px]"
                                    value={formData.challenge}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="solution">How You Solved It</Label>
                                <Textarea
                                    id="solution"
                                    name="solution"
                                    placeholder="Describe your technical solution..."
                                    className="min-h-[120px]"
                                    value={formData.solution}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t py-6">
                        <Button variant="ghost" type="button" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                "Start AI Analysis →"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
