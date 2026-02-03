export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        DevShowcase
                    </h1>
                    <p className="text-2xl text-muted-foreground">
                        AI-Powered Developer Skill Analysis Platform
                    </p>
                    <div className="bg-card border rounded-lg p-8 space-y-4">
                        <h2 className="text-xl font-semibold">🚀 Setup in Progress</h2>
                        <p className="text-muted-foreground">
                            Your DevShowcase platform is being built. Next steps:
                        </p>
                        <ol className="text-left space-y-2 max-w-2xl mx-auto">
                            <li>✅ Next.js 14 project initialized</li>
                            <li>⏳ Installing dependencies...</li>
                            <li>⏳ Setting up Supabase database</li>
                            <li>⏳ Configuring AI analysis engine</li>
                            <li>⏳ Building Q&A interface</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
