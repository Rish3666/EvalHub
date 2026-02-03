import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Github, ExternalLink, BarChart3, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { getScoreColor } from "@/lib/utils";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Fetch projects with their scorecards
    const { data: projects, error } = await supabase
        .from("projects")
        .select(`
      *,
      scorecards (
        overall_score,
        share_token
      ),
      project_analyses (
        id
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
    }

    return (
        <div className="container mx-auto py-12 px-4 space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Your Projects</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your project analyses and skill scorecards.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/new-project">
                        <Plus className="mr-2 h-4 w-4" /> New Analysis
                    </Link>
                </Button>
            </div>

            {!projects || projects.length === 0 ? (
                <Card className="border-dashed py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            <Github className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">No projects yet</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Get started by analyzing your first GitHub project to generate a skill scorecard.
                            </p>
                        </div>
                        <Button asChild className="mt-4">
                            <Link href="/new-project">Start Your First Analysis</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                        const hasAnalysis = project.project_analyses?.length > 0;
                        const scorecard = project.scorecards?.[0];
                        const status = scorecard
                            ? "Completed"
                            : hasAnalysis
                                ? "Awaiting Q&A"
                                : "Awaiting Analysis";

                        return (
                            <Card key={project.id} className="flex flex-col overflow-hidden">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant={scorecard ? "default" : "secondary"}>
                                            {status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {project.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="flex gap-2 flex-wrap text-sm">
                                        {project.tech_stack.slice(0, 3).map((tech: string) => (
                                            <Badge key={tech} variant="outline" className="font-normal">
                                                {tech}
                                            </Badge>
                                        ))}
                                        {project.tech_stack.length > 3 && (
                                            <Badge variant="outline" className="font-normal">
                                                +{project.tech_stack.length - 3}
                                            </Badge>
                                        )}
                                    </div>

                                    {scorecard && (
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium">Overall Score</span>
                                            </div>
                                            <span className={`text-lg font-bold ${getScoreColor(scorecard.overall_score)}`}>
                                                {scorecard.overall_score}/100
                                            </span>
                                        </div>
                                    )}

                                    {!scorecard && (
                                        <div className="flex flex-col gap-2 pt-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>Analysis started {new Date(project.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {!hasAnalysis && (
                                                <div className="flex items-center gap-2 text-sm text-yellow-600">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>AI is analyzing repo...</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="border-t bg-muted/20 p-4 flex gap-2">
                                    {scorecard ? (
                                        <>
                                            <Button variant="outline" size="sm" className="flex-1" asChild>
                                                <Link href={`/project/${project.id}/scorecard`}>
                                                    View Report
                                                </Link>
                                            </Button>
                                            <Button size="sm" className="flex-1" asChild>
                                                <Link href={`/scorecard/${scorecard.share_token}`} target="_blank">
                                                    <Share2 className="mr-2 h-4 w-4" /> Share
                                                </Link>
                                            </Button>
                                        </>
                                    ) : (
                                        <Button className="w-full" asChild>
                                            <Link href={hasAnalysis ? `/project/${project.id}/analysis` : "#"}>
                                                {hasAnalysis ? "Continue Q&A →" : "Processing..."}
                                            </Link>
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Helper icon for share
function Share2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" x2="12" y1="2" y2="15" />
        </svg>
    );
}
