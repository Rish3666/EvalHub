'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { TrendingUp, PieChart } from 'lucide-react'
import { motion } from 'framer-motion'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const trendingTechs = [
    { name: 'Next.js', projectCount: 1240, growthPercent: 45 },
    { name: 'Supabase', projectCount: 890, growthPercent: 32 },
    { name: 'TailwindCSS', projectCount: 2100, growthPercent: 12 },
]

const userTechDistribution = [
    { name: 'React', value: 40 },
    { name: 'TypeScript', value: 30 },
    { name: 'Node.js', value: 20 },
    { name: 'Python', value: 10 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const suggestedDevelopers = [
    { id: 1, name: 'Sarah Lee', projectsCount: 12, avatar: 'https://github.com/shadcn.png' },
    { id: 2, name: 'Mike Ross', projectsCount: 8, avatar: 'https://github.com/shadcn.png' },
]

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function RightSidebar() {
    return (
        <aside className="sticky top-0 h-screen w-80 p-4 space-y-4 overflow-y-auto hidden xl:block border-l border-border bg-background">
            {/* Trending Tech Stacks */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Trending Tech Stacks
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {trendingTechs.map((tech, index) => (
                        <motion.div
                            key={tech.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between group cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-muted-foreground/50">
                                    #{index + 1}
                                </span>
                                <div>
                                    <p className="font-medium group-hover:text-primary transition-colors">
                                        {tech.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {tech.projectCount} projects
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {tech.growthPercent}%
                            </Badge>
                        </motion.div>
                    ))}

                    <Button variant="ghost" className="w-full" size="sm">
                        Show more
                    </Button>
                </CardContent>
            </Card>

            {/* Your Tech Stack Distribution (Pie Chart) */}
            <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-primary" />
                        Your Tech Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Pie Chart using Recharts */}
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={userTechDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {userTechDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 space-y-2">
                        {userTechDistribution.map((tech, index) => (
                            <div key={tech.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span>{tech.name}</span>
                                </div>
                                <span className="font-medium">{tech.value}%</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Suggested Developers */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Who to Follow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {suggestedDevelopers.map((dev) => (
                        <div key={dev.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={dev.avatar} />
                                    <AvatarFallback>{dev.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{dev.name}</p>
                                    <p className="text-xs text-muted-foreground">{dev.projectsCount} projects</p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline">
                                Follow
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </aside>
    )
}
