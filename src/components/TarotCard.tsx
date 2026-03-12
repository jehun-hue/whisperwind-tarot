import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TarotCardProps {
  name: string;
  koreanName?: string;
  isReversed?: boolean;
  image?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  onClick?: () => void;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  name,
  koreanName,
  isReversed = false,
  image,
  className,
  size = "md",
  showName = true,
  onClick,
}) => {
  const sizeClasses = {
    xs: "h-20 w-12 text-[7px]",
    sm: "h-24 w-16 text-[8px]",
    md: "h-32 w-20 text-[10px]",
    lg: "h-48 w-32 text-xs",
    xl: "h-64 w-40 text-sm",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 transition-all duration-500",
        sizeClasses[size],
        isReversed
          ? "border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] bg-gradient-to-br from-purple-900/60 via-indigo-950/40 to-blue-900/60"
          : "border-gold/50 shadow-[0_0_15px_rgba(200,168,100,0.3)] bg-gradient-to-br from-purple-900/60 via-amber-950/40 to-gold/40",
        "hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      {/* Background Glow Overlay */}
      <div 
        className={cn(
          "absolute inset-0 z-0 opacity-30 transition-opacity group-hover:opacity-50",
          isReversed ? "bg-blue-400/10" : "bg-gold/10"
        )} 
      />

      {/* Card Content Wrapper */}
      <div className={cn(
        "relative z-10 h-full w-full flex flex-col items-center justify-center p-1.5",
        isReversed && "rotate-180"
      )}>
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="h-full w-full object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-all duration-500 saturate-[0.8] group-hover:saturate-100" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-gold/60 text-3xl font-light animate-pulse">✦</span>
            <span className="text-[8px] text-muted-foreground/40 italic uppercase tracking-tighter">mystic arcana</span>
          </div>
        )}

        {showName && (
          <div className="absolute bottom-1 left-1 right-1 rounded-lg bg-black/60 backdrop-blur-md py-1 border border-white/5">
            <span className="font-display font-medium text-white block truncate px-1 text-center animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-gold-light via-white to-gold-light">
              {koreanName || name}
            </span>
          </div>
        )}
      </div>

      {/* Premium Border Highlight */}
      <div className={cn(
        "absolute inset-0 z-20 pointer-events-none rounded-xl border border-white/5 group-hover:border-white/20 transition-all duration-500"
      )} />
      
      {/* Decorative Corner Accents */}
      <div className="absolute top-1 left-1 h-2 w-2 border-t border-l border-gold/40 rounded-tl-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-1 right-1 h-2 w-2 border-t border-r border-gold/40 rounded-tr-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-gold/40 rounded-bl-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-gold/40 rounded-br-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity" />

      {isReversed && (
        <div className="absolute top-0 left-0 right-0 z-40 bg-indigo-600/90 py-0.5 text-[6px] text-white text-center font-bold uppercase tracking-[0.2em] shadow-lg">
          Reversed
        </div>
      )}
    </motion.div>
  );
};
