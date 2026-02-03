'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Mock Data
const INITIAL_GROUPS = [
    { id: 1, name: 'OS_Contributors', tags: 'Public', desc: 'Discussing kernel patches, driver development, and low-level optimization strategies.' },
    { id: 2, name: 'Rust_Guild', tags: 'Invite', desc: 'Exploring ownership, borrowing, and advanced macro systems in Rust.' }
]

export default function CommunityPage() {
    const [groups, setGroups] = useState(INITIAL_GROUPS)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newGroup, setNewGroup] = useState({ name: '', desc: '', tags: 'Public' })
    const supabase = createClient()

    const handleJoin = (groupName: string) => {
        // Mock join logic
        toast.success(`Request sent to join ${groupName}`)
    }

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroup.name || !newGroup.desc) {
            toast.error("Please fill in all fields")
            return
        }

        const group = {
            id: groups.length + 1,
            name: newGroup.name,
            desc: newGroup.desc,
            tags: newGroup.tags
        }

        setGroups([group, ...groups]) // Add to top
        setIsCreateOpen(false)
        setNewGroup({ name: '', desc: '', tags: 'Public' })
        toast.success(`Community "${group.name}" initialized.`)
    }

    return (
        <div className="w-full pt-4">
            <div className="w-full mb-8 flex flex-col md:flex-row items-end justify-between gap-4">
                <div>
                    <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight tracking-tighter">
                        Community
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base mt-2 tracking-widest font-mono">&gt; Discover_Network // Active_Nodes: {1248 + groups.length}</p>
                </div>

                {/* Create Community Trigger */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="border border-white bg-black text-white hover:bg-white hover:text-black font-mono font-bold tracking-widest uppercase rounded-none px-6">
                            + Initialize_Node
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border border-white text-white font-mono rounded-none max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold tracking-widest uppercase mb-4 text-center">New Community Protocol</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateGroup} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-widest">Node ID (Name)</label>
                                <Input
                                    className="bg-white/5 border-white/20 rounded-none text-white focus:border-white"
                                    placeholder="e.g. AI_Research_Lab"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-widest">Protocol Spec (Description)</label>
                                <Textarea
                                    className="bg-white/5 border-white/20 rounded-none text-white focus:border-white min-h-[100px]"
                                    placeholder="Describe the community purpose..."
                                    value={newGroup.desc}
                                    onChange={(e) => setNewGroup({ ...newGroup, desc: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase tracking-widest">Access Level</label>
                                <select
                                    className="w-full bg-white/5 border border-white/20 rounded-none text-white p-2 text-sm focus:border-white outline-none"
                                    value={newGroup.tags}
                                    onChange={(e) => setNewGroup({ ...newGroup, tags: e.target.value })}
                                >
                                    <option value="Public">Public</option>
                                    <option value="Invite">Invite Only</option>
                                    <option value="Private">Private</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase rounded-none pt-2">
                                Deploy Node
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full flex-1">
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between mb-2 border-b border-white/20 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">group</span>
                            <h3 className="text-sm font-bold tracking-widest">Friends</h3>
                        </div>
                        <div className="text-[10px] text-gray-400 animate-pulse tracking-widest">Live_Feed</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Friend Card 1 */}
                        <div className="border border-white p-6 bg-black flex flex-col justify-between h-full hover:border-gray-400 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 bg-white text-black flex items-center justify-center font-bold text-xl">
                                    DK
                                </div>
                                <span className="material-symbols-outlined text-gray-500 text-sm">verified</span>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-lg font-bold tracking-wider">Dev_Kairo</h4>
                                <p className="text-xs text-gray-400 mt-1 tracking-widest">Full_Stack // Rust</p>
                            </div>
                            <button className="w-full bg-white text-black py-2 text-xs font-bold tracking-widest hover:bg-gray-300 transition-colors">
                                Connect_
                            </button>
                        </div>

                        {/* Friend Card 2 */}
                        <div className="border border-white p-6 bg-black flex flex-col justify-between h-full hover:border-gray-400 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 border border-white text-white flex items-center justify-center font-bold text-xl">
                                    X9
                                </div>
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-lg font-bold tracking-wider">X_ae_99</h4>
                                <p className="text-xs text-gray-400 mt-1 tracking-widest">Backend // Go</p>
                            </div>
                            <button className="w-full border border-white text-white py-2 text-xs font-bold tracking-widest hover:bg-white hover:text-black transition-colors">
                                Connect_
                            </button>
                        </div>

                        {/* Friend Card 3 */}
                        <div className="border border-white p-6 bg-black flex flex-col justify-between h-full hover:border-gray-400 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 border border-white text-white flex items-center justify-center font-bold text-xl">
                                    SA
                                </div>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-lg font-bold tracking-wider">Sys_Admin_01</h4>
                                <p className="text-xs text-gray-400 mt-1 tracking-widest">DevOps // K8s</p>
                            </div>
                            <button className="w-full border border-white text-white py-2 text-xs font-bold tracking-widest hover:bg-white hover:text-black transition-colors">
                                Connect_
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center gap-2 mb-2 border-b border-white/20 pb-2">
                        <span className="material-symbols-outlined text-sm">groups</span>
                        <h3 className="text-sm font-bold tracking-widest">Groups</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {groups.map((group) => (
                            <div key={group.id} className="border border-white p-5 hover:bg-white/5 transition-all group flex flex-col gap-4 bg-black">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-bold tracking-widest">{group.name}</h4>
                                    <span className="text-[10px] text-gray-400 border border-gray-600 px-1 py-0.5">{group.tags}</span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono leading-relaxed">{group.desc}</p>
                                <button
                                    onClick={() => handleJoin(group.name)}
                                    className="w-full border border-white text-white py-2 text-xs font-bold tracking-widest hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
                                >
                                    Join_ <span className="material-symbols-outlined text-[14px]">login</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Project Teams */}
            <div className="w-full border border-white p-6 lg:p-8 mt-4 bg-black">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-sm">hub</span>
                        <h3 className="text-sm font-bold tracking-widest">Top_Project_Teams</h3>
                    </div>
                    <div className="text-[10px] text-gray-400 tracking-widest">Weekly_Metrics</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Team 1 */}
                    <div className="group cursor-pointer">
                        <div className="flex justify-between items-end border-b border-gray-800 pb-2 group-hover:border-white transition-colors">
                            <h4 className="font-bold text-base tracking-wider">Open_Core</h4>
                            <span className="text-xs text-gray-400 font-mono">Mbrs: 24</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1 mt-2">
                            <div className="bg-white h-full w-[85%] group-hover:shadow-[0_0_10px_white] transition-all duration-500"></div>
                        </div>
                    </div>
                    {/* Team 2 */}
                    <div className="group cursor-pointer">
                        <div className="flex justify-between items-end border-b border-gray-800 pb-2 group-hover:border-white transition-colors">
                            <h4 className="font-bold text-base tracking-wider">Data_Mesh</h4>
                            <span className="text-xs text-gray-400 font-mono">Mbrs: 18</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1 mt-2">
                            <div className="bg-white h-full w-[65%] group-hover:shadow-[0_0_10px_white] transition-all duration-500"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full pt-4 border-t border-dashed border-white/30 flex justify-between text-[10px] md:text-xs text-gray-500 tracking-widest">
                <span>EvalHub_ OS v2.0.4</span>
                <span className="animate-pulse">_Cursor_Active</span>
                <span>Mem: 64k OK</span>
            </div>
        </div>
    )
}
