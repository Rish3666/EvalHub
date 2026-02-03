"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Github, Loader2, Search, ArrowRight, Code, Star, Calendar, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    language: string;
    stargazers_count: number;
    updated_at: string;
}

interface GitHubUserSuggestion {
    login: string;
    avatar_url: string;
}

export default function NewProjectPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const [authLoading, setAuthLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
            }
            setAuthLoading(false);
        };
        checkUser();
    }, [supabase.auth]);

    const [step, setStep] = useState(1); // 1: Username, 2: Repo Selection, 3: Details
    const [loading, setLoading] = useState(false);
    const [githubUsername, setGithubUsername] = useState("");
    const [repos, setRepos] = useState<GitHubRepo[]>([]);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<GitHubUserSuggestion[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dropdownRef = useRef<HTMLFormElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        repo_url: "",
        description: "",
        tech_stack: "",
        challenge: "",
        solution: "",
    });

    // Handle debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (githubUsername.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            setSearchLoading(true);
            try {
                const res = await fetch(`/api/github/search-users?q=${githubUsername}`);
                const data = await res.json();
                if (res.ok) {
                    setSuggestions(data.users || []);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error("Autocomplete error:", error);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [githubUsername]);

    // Close dropdown on click away
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFetchRepos = async (usernameToFetch?: string) => {
        const username = usernameToFetch || githubUsername;
        if (!username) return;

        setLoading(true);
        setShowSuggestions(false);
        try {
            const res = await fetch(`/api/github/repos?username=${username}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch repositories");

            setRepos(data);
            setStep(2);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSuggestion = (user: GitHubUserSuggestion) => {
        setGithubUsername(user.login);
        setShowSuggestions(false);
        handleFetchRepos(user.login);
    };

    const handleSelectRepo = (repo: GitHubRepo) => {
        // Construct project data directly
        const projectData = {
            title: repo.name.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
            repo_url: repo.html_url,
            description: repo.description || "",
            tech_stack: repo.language || "",
            challenge: "",
            solution: "",
        };

        // Update form data state for consistency (optional, but good for debugging)
        setFormData(projectData);

        // Directly trigger project creation/analysis
        executeProjectCreation(projectData);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const executeProjectCreation = async (dataToSubmit: typeof formData) => {
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            const { data: project, error } = await supabase
                .from("projects")
                .insert({
                    user_id: userId,
                    title: dataToSubmit.title,
                    repo_url: dataToSubmit.repo_url,
                    description: dataToSubmit.description,
                    tech_stack: dataToSubmit.tech_stack.split(",").map((t) => t.trim()).filter(Boolean),
                    challenge: dataToSubmit.challenge,
                    solution: dataToSubmit.solution,
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Project Created!",
                description: "Starting AI analysis...",
            });

            const analysisRes = await fetch(`/api/projects/${project.id}/analyze`, {
                method: "POST",
            });

            const analysisData = await analysisRes.json();
            if (!analysisRes.ok) throw new Error(analysisData.error || "Failed to start analysis");

            router.push(`/project/${project.id}/analysis`);
        } catch (error: any) {
            console.error("Error creating project:", error);
            console.dir(error);

            toast({
                title: "Error Creating Project",
                description: `${error.message || "Something went wrong."} (${error.code || "No code available"})`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium italic">Verifying session...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Page Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="rounded-full">
                        ←
                    </Button>
                    <h1 className="text-xl font-bold">
                        {step === 1 && "Import GitHub Profile"}
                        {step === 2 && "Select Repository"}
                        {step === 3 && "Final Details"}
                    </h1>
                </div>
            </div>

            <div className="px-4 py-8">
                {step === 1 && (
                    <div className="max-w-md mx-auto space-y-8 text-center pt-12">
                        <div className="space-y-2">
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Github className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Automate Import</h2>
                            <p className="text-muted-foreground">Search for your GitHub profile to fetch projects.</p>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleFetchRepos(); }} className="space-y-4 relative" ref={dropdownRef}>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="GitHub Username"
                                    value={githubUsername}
                                    onChange={(e) => {
                                        setGithubUsername(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    className="pl-12 h-14 bg-muted/30 border-none text-lg rounded-full focus-visible:ring-1 focus-visible:ring-primary/20"
                                    required
                                    onFocus={() => githubUsername.length >= 2 && setShowSuggestions(true)}
                                />
                                {searchLoading && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && (suggestions.length > 0 || searchLoading) && (
                                <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-border/50 shadow-2xl overflow-hidden rounded-2xl bg-card/95 backdrop-blur-xl">
                                    <div className="p-1">
                                        {suggestions.map((user) => (
                                            <div
                                                key={user.login}
                                                className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer transition-colors rounded-xl group"
                                                onClick={() => handleSelectSuggestion(user)}
                                            >
                                                <Image
                                                    src={user.avatar_url}
                                                    alt={user.login}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 rounded-full border border-border/50"
                                                />
                                                <div className="flex-1 text-left">
                                                    <p className="font-bold group-hover:text-primary transition-colors">{user.login}</p>
                                                    <p className="text-xs text-muted-foreground">View repositories</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                            </div>
                                        ))}
                                        {suggestions.length === 0 && !searchLoading && githubUsername.length >= 2 && (
                                            <div className="p-4 text-sm text-muted-foreground italic">No users found</div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            <Button type="submit" size="lg" className="w-full rounded-full h-14 font-bold text-lg" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : "Fetch Repositories"}
                            </Button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Select a Project</h2>
                            <p className="text-sm text-muted-foreground">{repos.length} repos found</p>
                        </div>

                        <div className="grid gap-3">
                            {repos.map((repo) => (
                                <Card
                                    key={repo.id}
                                    className="p-4 hover:bg-muted/10 cursor-pointer transition-colors border-border/50 group"
                                    onClick={() => handleSelectRepo(repo)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{repo.name}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{repo.description || "No description provided."}</p>
                                            <div className="flex items-center gap-4 pt-2">
                                                {repo.language && (
                                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                                        <Code className="h-3 w-3" />
                                                        {repo.language}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <Star className="h-3 w-3" />
                                                    {repo.stargazers_count}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(repo.updated_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary mt-1" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
