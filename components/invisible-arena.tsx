"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, Trophy, Radar, Heart, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// --- TypeScript Interfaces ---
interface SonarPulse { x: number; y: number; radius: number; maxRadius: number }
interface KillFeedItem { id: string; message: string; timestamp: string }
interface Entity { x: number; y: number; id: number; revealed: boolean }
interface Enemy { x: number; y: number; id: string }

const GRID_SIZE = 15
const CELL_SIZE = 40
const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE
const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE

export default function InvisibleArena() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isClient, setIsClient] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const keysPressed = useRef<Set<string>>(new Set())

  // Game State
  const [player, setPlayer] = useState({ x: 7, y: 7, lives: 3 })
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState<number | null>(null)
  const [target, setTarget] = useState<Entity>({ x: 3, y: 3, id: 1, revealed: false })
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [sonarPulse, setSonarPulse] = useState<SonarPulse | null>(null)
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([])

  // Initialize client and starting state
  useEffect(() => {
    setIsClient(true)
    // Spawn initial enemy far from center
    setEnemies([{ x: 0, y: 0, id: `init-enemy-${Math.random()}` }])
    setKillFeed([{
      id: `boot-${Date.now()}-${Math.random()}`,
      message: "SYSTEM_BOOT: Scanning for data fragments...",
      timestamp: new Date().toLocaleTimeString()
    }])
  }, [])

  // Main Game Loop
  useEffect(() => {
    if (!isClient || player.lives <= 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gameLoop = () => {
      const keys = keysPressed.current
      const speed = 0.09 // Adjusted for smoother movement
      let dx = 0, dy = 0

      if (keys.has("w") || keys.has("arrowup")) dy -= speed
      if (keys.has("s") || keys.has("arrowdown")) dy += speed
      if (keys.has("a") || keys.has("arrowleft")) dx -= speed
      if (keys.has("d") || keys.has("arrowright")) dx += speed

      // 1. Update Player & Collect Target
      setPlayer(prev => {
        const newX = Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx))
        const newY = Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy))

        const dist = Math.sqrt((newX - target.x) ** 2 + (newY - target.y) ** 2)
        setDistance(dist)

        if (dist < 0.6) {
          const newScore = score + 100
          setScore(newScore)
          setTarget({
            x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
            y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
            id: Date.now(),
            revealed: false
          })

          // Spawn a new enemy every 300 points
          if (newScore % 300 === 0) {
            setEnemies(prevE => [...prevE, { x: 0, y: 0, id: `enemy-${Date.now()}-${Math.random()}` }])
          }

          setKillFeed(f => [...f, {
            id: `node-${Date.now()}-${Math.random()}`,
            message: "DATA_NODE_SECURED (+100)",
            timestamp: new Date().toLocaleTimeString()
          }].slice(-8))
        }

        return { ...prev, x: newX, y: newY }
      })

      // 2. Update Enemies (AI chasing player)
      setEnemies(prevEnemies => prevEnemies.map(enemy => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
        const newEx = enemy.x + Math.cos(angle) * 0.022 // Balanced chase speed
        const newEy = enemy.y + Math.sin(angle) * 0.022

        // Collision Detection
        const distToPlayer = Math.sqrt((newEx - player.x) ** 2 + (newEy - player.y) ** 2)
        if (distToPlayer < 0.45) {
          setPlayer(p => ({ ...p, lives: Math.max(0, p.lives - 1) }))
          setKillFeed(f => [...f, {
            id: `dmg-${Date.now()}-${Math.random()}`,
            message: "WARNING: EXTERNAL INTERFERENCE DETECTED",
            timestamp: new Date().toLocaleTimeString()
          }].slice(-8))
          return { x: 0, y: 0, id: enemy.id } // Reset enemy to corner
        }

        return { ...enemy, x: newEx, y: newEy }
      }))

      // 3. Update Sonar
      if (sonarPulse) {
        setSonarPulse(p => {
          if (!p || p.radius >= p.maxRadius) return null
          const tx = target.x * CELL_SIZE + 20, ty = target.y * CELL_SIZE + 20
          const dToT = Math.sqrt((tx - p.x) ** 2 + (ty - p.y) ** 2)
          if (dToT < p.radius) setTarget(t => ({ ...t, revealed: true }))
          return { ...p, radius: p.radius + 7 }
        })
      }

      // --- Rendering ---
      ctx.fillStyle = "#020205"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw Sonar
      if (sonarPulse && sonarPulse.radius > 5) {
        ctx.strokeStyle = "rgba(34, 211, 238, 0.4)"
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(sonarPulse.x, sonarPulse.y, sonarPulse.radius, 0, Math.PI * 2); ctx.stroke()
      }

      // Draw Target
      if (target.revealed) {
        ctx.fillStyle = "#fbbf24"
        ctx.shadowBlur = 15
        ctx.shadowColor = "#fbbf24"
        ctx.fillRect(target.x * CELL_SIZE + 10, target.y * CELL_SIZE + 10, 20, 20)
        ctx.shadowBlur = 0
      }

      // Draw Enemies (Red Glow)
      enemies.forEach(e => {
        const dist = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2)
        ctx.fillStyle = dist < 2.5 ? "#ef4444" : "#ef444433"
        ctx.beginPath(); ctx.arc(e.x * CELL_SIZE + 20, e.y * CELL_SIZE + 20, 8, 0, Math.PI * 2); ctx.fill()
      })

      // Draw Player
      ctx.fillStyle = "#22d3ee"
      ctx.shadowBlur = 10
      ctx.shadowColor = "#22d3ee"
      ctx.beginPath(); ctx.arc(player.x * CELL_SIZE + 20, player.y * CELL_SIZE + 20, 10, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current) }
  }, [isClient, player, target, sonarPulse, enemies, score])

  // Key Listeners
  useEffect(() => {
    if (!isClient) return
    const down = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())
      if (e.key === " ") {
        setSonarPulse({ x: player.x * CELL_SIZE + 20, y: player.y * CELL_SIZE + 20, radius: 0, maxRadius: 380 })
        setTarget(t => ({ ...t, revealed: false }))
      }
    }
    const up = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase())
    window.addEventListener("keydown", down); window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [isClient, player])

  if (!isClient) return null

  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-mono p-4 flex flex-col items-center">
      {/* Header UI */}
      <div className="w-full max-w-5xl flex justify-between mb-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">Integrity</span>
            <div className="flex gap-1 text-red-500 mt-1">
              {player.lives > 0 ? (
                Array.from({ length: player.lives }).map((_, i) => <Heart key={i} size={16} fill="currentColor" />)
              ) : (
                <span className="text-xs font-bold text-red-600 animate-pulse">SYSTEM HALTED</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">Data_Secured</span>
            <div className="flex items-center gap-2 text-amber-400">
              <Trophy size={16} /> <span className="text-2xl font-bold">{score}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">Prox_Sensor</span>
          <div className="flex items-center gap-2 text-cyan-500 mt-1">
            <Radar size={16} className={distance && distance < 2 ? "animate-ping" : ""} />
            <span className="text-lg font-bold">{distance ? (distance * 10).toFixed(0) : "0"}m</span>
          </div>
        </div>
      </div>

      {/* Game Layout */}
      <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="relative group">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="rounded-xl border border-slate-800 bg-black transition-colors duration-500 group-hover:border-slate-700" />

          <AnimatePresence>
            {player.lives <= 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-xl z-50 p-6 text-center"
              >
                <h2 className="text-4xl font-black text-red-600 mb-2 tracking-tighter">CONNECTION LOST</h2>
                <div className="w-48 h-px bg-red-900/50 mb-4" />
                <p className="text-slate-500 text-sm mb-8 max-w-xs">Data collection interrupted. Final archive score: <span className="text-white font-bold">{score}</span></p>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                >
                  <RefreshCw size={18} /> REBOOT SYSTEM
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-slate-900/20 rounded-xl border border-slate-800 p-4 h-[600px] flex flex-col backdrop-blur-sm">
          <h3 className="text-[10px] font-bold mb-4 flex items-center gap-2 text-white/40 uppercase tracking-widest">
            <Activity size={12} className="text-cyan-500" /> Kernel_Log
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout" initial={false}>
              {killFeed.slice().reverse().map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-slate-800/20 rounded border-l-2 border-cyan-500/50 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="text-[11px] text-slate-200 leading-tight">{item.message}</div>
                  <div className="text-[8px] text-slate-500 mt-1">{item.timestamp}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}