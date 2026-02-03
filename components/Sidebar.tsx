"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, PlusCircle, Sparkles, User, Bell, Mail, Hash, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
    { icon: Sparkles, label: "Home", href: "/" },
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: PlusCircle, label: "New Project", href: "/new-project" },
    { icon: Bell, label: "Notifications", href: "#" },
    { icon: Mail, label: "Messages", href: "#" },
    { icon: Bookmark, label: "Bookmarks", href: "#" },
    { icon: User, label: "Profile", href: "#" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-screen h-sticky top-0 p-4 gap-4 w-full max-w-[275px]">
            <div className="px-4 py-2 hover:bg-accent rounded-full w-fit transition-colors cursor-pointer">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>

            <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-colors hover:bg-accent w-fit ${isActive ? "font-bold" : "font-normal"
                                }`}
                        >
                            <item.icon className="h-7 w-7" />
                            <span className="hidden xl:inline">{item.label}</span>
                        </Link>
                    );
                })}
                <div className="flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-colors hover:bg-accent w-fit cursor-pointer">
                    <MoreHorizontal className="h-7 w-7" />
                    <span className="hidden xl:inline">More</span>
                </div>
            </nav>

            <div className="mt-4">
                <Button className="w-full py-6 text-lg font-bold rounded-full shadow-md" size="lg">
                    <span className="hidden xl:inline">Post Analysis</span>
                    <PlusCircle className="xl:hidden h-6 w-6" />
                </Button>
            </div>

            <div className="mt-auto flex items-center gap-3 p-3 hover:bg-accent rounded-full cursor-pointer transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border shrink-0">
                    <User className="h-6 w-6 text-primary" />
                </div>
                <div className="hidden xl:flex flex-col flex-1 overflow-hidden">
                    <span className="font-bold truncate text-sm">User Name</span>
                    <span className="text-muted-foreground truncate text-sm">@username</span>
                </div>
                <MoreHorizontal className="hidden xl:block h-4 w-4 text-muted-foreground ml-auto" />
            </div>
        </div>
    );
}
