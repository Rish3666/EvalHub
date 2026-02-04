"use client"
import { TerminalHeader } from "@/components/TerminalHeader";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isCommunityChat = pathname?.startsWith('/community/') && pathname !== '/community';

    return (
        <div className="min-h-screen bg-black text-white font-mono flex flex-col">
            <TerminalHeader />

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 w-full flex flex-col relative z-10",
                !isCommunityChat && "max-w-[1440px] mx-auto p-4 md:p-8 flex flex-col gap-8"
            )}>
                {children}
            </div>

            {/* Global Background Noise */}
            <div className="fixed inset-0 pointer-events-none z-[0] opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 2px, 3px 100%'
            }} />
        </div>
    );
}
