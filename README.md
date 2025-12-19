#  Invisible Arena

A high-performance, stealth-based data collection game built with **Next.js 15**, **HTML5 Canvas**, and **Framer Motion**.



##  Overview
Invisible Arena is a tactical survival game where you navigate a probe through a dark, anomaly-filled void. Players must use a sonar-ping mechanic to locate hidden data fragments while avoiding hostile red anomalies that track the player's signal.

##  Key Features
- **Custom Canvas Engine:** High-performance game loop using `requestAnimationFrame` and HTML5 Canvas.
- **Stealth Mechanics:** Data nodes and enemies are partially hidden; players must use a **Sonar Pulse** (Spacebar) to reveal the environment.
- **Dynamic Difficulty:** Enemy count and chase speed scale as your score increases.
- **Hydration Optimized:** Custom state management to handle Next.js Server-Side Rendering (SSR) and Client-Side hydration mismatches.
- **Terminal UI:** An animated system log built with Framer Motion that tracks game events in real-time.

##  Controls
| Action | Input |
| :--- | :--- |
| **Move Probe** | `W` `A` `S` `D` / `Arrow Keys` |
| **Sonar Pulse** | `Spacebar` |
| **Restart Game** | `Reboot System` Button |



##  Tech Stack
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

##  Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/dhivakarav/invisible-arena.git](https://github.com/dhivakarav/invisible-arena.git)
