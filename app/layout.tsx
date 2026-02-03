// Build trigger: $(date)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "EvalHub - AI-Powered Developer Skill Analysis",
    description: "Get AI-generated skill scorecards based on your projects. Upload your GitHub repos and answer intelligent questions to showcase your true technical abilities.",
    keywords: ["developer portfolio", "skill assessment", "AI analysis", "GitHub projects", "technical interview"],
    authors: [{ name: "EvalHub" }],
    openGraph: {
        title: "EvalHub - AI-Powered Developer Skill Analysis",
        description: "Get AI-generated skill scorecards based on your projects",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <body className={`${inter.className} min-h-screen bg-background`}>
                <div className="container mx-auto flex justify-center">
                    {/* Left Sidebar - Fixed positioning handled via classes if preferred, but flex container is fine for centering layout like X */}
                    <aside className="hidden sm:flex flex-col border-r border-border/50 sticky top-0 h-screen w-fit xl:w-[275px]">
                        <Sidebar />
                    </aside>

                    {/* Main Feed */}
                    <main className="flex-1 max-w-[600px] border-r border-border/50 min-h-screen relative">
                        {children}
                    </main>

                    {/* Right Sidebar - Trends and Search */}
                    <aside className="hidden lg:block w-[350px] sticky top-0 h-screen ml-8">
                        <RightSidebar />
                    </aside>
                </div>
                <Toaster />
            </body>
        </html>
    );
}
