import React, { useMemo } from "react";
import { motion } from "framer-motion";

// Constellation lines connecting stars
const constellationPaths = [
  // Orion-like
  "M 15 20 L 18 25 L 22 22 L 25 28 L 20 35 L 15 32 L 18 25",
  // Cassiopeia-like
  "M 60 15 L 65 22 L 70 18 L 75 25 L 80 20",
  // Triangle
  "M 40 60 L 50 55 L 45 70 L 40 60",
  // Small dipper-like
  "M 75 55 L 80 58 L 85 55 L 88 60 L 85 65",
  // Cross
  "M 25 75 L 30 70 L 35 75 L 30 80 L 25 75",
];

interface CosmicStar {
  id: number;
  cx: number;
  cy: number;
  r: number;
  delay: number;
  brightness: number;
}

export default function CosmicBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        id: i,
        cx: Math.random() * 100,
        cy: Math.random() * 100,
        r: Math.random() * 0.4 + 0.1,
        delay: Math.random() * 6,
        brightness: Math.random() * 0.4 + 0.15,
      })) as CosmicStar[],
    []
  );

  const shootingStars = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        startX: Math.random() * 60 + 20,
        startY: Math.random() * 30 + 5,
        delay: Math.random() * 15 + 5,
        duration: Math.random() * 1 + 0.5,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Deep cosmic gradient */}
      <div className="absolute inset-0 bg-cosmic-gradient" />

      {/* Nebula blobs */}
      <div
        className="absolute animate-nebula"
        style={{
          top: "10%",
          left: "20%",
          width: "40vw",
          height: "40vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, hsl(270 60% 40% / 0.2) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute animate-nebula"
        style={{
          top: "50%",
          right: "10%",
          width: "35vw",
          height: "35vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, hsl(220 70% 40% / 0.15) 0%, transparent 70%)",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute animate-nebula"
        style={{
          bottom: "5%",
          left: "5%",
          width: "30vw",
          height: "25vh",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, hsl(300 40% 35% / 0.12) 0%, transparent 70%)",
          animationDelay: "2s",
        }}
      />

      {/* Stars and constellations SVG */}
      <svg
        className="absolute inset-0 h-full w-full animate-constellation-drift"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Constellation lines */}
        {constellationPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="hsl(220 40% 60% / 0.08)"
            strokeWidth="0.08"
            strokeLinecap="round"
          />
        ))}

        {/* Stars */}
        {stars.map((star) => (
          <circle
            key={star.id}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill={star.r > 1 ? "hsl(220 60% 90%)" : "hsl(240 20% 80%)"}
            opacity={star.brightness}
            style={{
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}

        {/* Bright constellation anchor stars */}
        {[
          [15, 20], [18, 25], [22, 22], [25, 28], [20, 35], [15, 32],
          [60, 15], [65, 22], [70, 18], [75, 25], [80, 20],
          [40, 60], [50, 55], [45, 70],
          [75, 55], [80, 58], [85, 55], [88, 60], [85, 65],
          [25, 75], [30, 70], [35, 75], [30, 80],
        ].map(([cx, cy], i) => (
          <circle
            key={`anchor-${i}`}
            cx={cx}
            cy={cy}
            r={0.25}
            fill="hsl(220 70% 85%)"
            opacity={0.5}
            style={{
              animation: `twinkle ${3 + Math.random() * 2}s ease-in-out ${Math.random() * 3}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Shooting stars */}
      {shootingStars.map((ss) => (
        <motion.div
          key={ss.id}
          className="absolute h-[1px] w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          style={{
            top: `${ss.startY}%`,
            left: `${ss.startX}%`,
            transform: "rotate(-35deg)",
          }}
          animate={{
            x: [0, 200],
            y: [0, 120],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: ss.duration,
            delay: ss.delay,
            repeat: Infinity,
            repeatDelay: ss.delay + 10,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
