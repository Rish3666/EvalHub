'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

function FloatingStars() {
    const starsRef = useRef<THREE.Points>(null)
    const mouseRef = useRef({ x: 0, y: 0 })

    useFrame((state) => {
        if (!starsRef.current) return

        // Smooth mouse follow with elastic easing
        const targetX = (mouseRef.current.x - window.innerWidth / 2) / window.innerWidth
        const targetY = -(mouseRef.current.y - window.innerHeight / 2) / window.innerHeight

        starsRef.current.rotation.x += (targetY * 0.5 - starsRef.current.rotation.x) * 0.05
        starsRef.current.rotation.y += (targetX * 0.5 - starsRef.current.rotation.y) * 0.05
    })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Stars ref={starsRef} radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Float>
    )
}

export function Hero3D() {
    return (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <ambientLight intensity={0.5} />
                <FloatingStars />
            </Canvas>
        </div>
    )
}
