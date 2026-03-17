import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import cardBackImg from "@/assets/card-back.png";

interface TarotCardProps {
  name: string;
  koreanName?: string;
  isReversed?: boolean;
  image?: string;
  cardImage?: string; // Alias for image
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  isFlipped?: boolean;
  onClick?: () => void;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  name,
  koreanName,
  isReversed = false,
  image,
  cardImage,
  className,
  size = "md",
  showName = true,
  isFlipped = true,
  onClick,
}) => {
  const displayImage = image || cardImage;
  const sizeClasses = {
    xs: "min-h-[5rem] w-12 text-[7px]",
    sm: "min-h-[6rem] w-16 text-[8px]",
    md: "min-h-[8rem] w-20 text-[10px]",
    lg: "min-h-[12rem] w-32 text-xs",
    xl: "min-h-[16rem] w-40 text-sm",
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
      {!isFlipped ? (
        <div className="absolute inset-0 z-10 w-full h-full">
          <img src={cardBackImg} alt="Card Back" className="w-full h-full object-cover opacity-80" />
        </div>
      ) : (
        <div className={cn(
          "relative z-10 h-full w-full flex flex-col items-center justify-center p-1.5 pb-8", // added padding-bottom to avoid overlap
          isReversed && "rotate-180"
        )}>
          {displayImage ? (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-lg">
              <img 
                src={displayImage} 
                alt={name} 
                className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-110 group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            </div>
          ) : (
            <div className={cn(
              "flex flex-col items-center justify-center gap-2",
              isReversed && "rotate-180"
            )}>
              <span className="text-gold/60 text-3xl font-light animate-pulse">✦</span>
              <span className="text-[8px] text-muted-foreground/40 italic uppercase tracking-tighter">mystic arcana</span>
            </div>
          )}
        </div>
      )}

      {isFlipped && showName && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/70 backdrop-blur-md py-1.5 px-1 border-t border-white/10 z-20 min-h-[2.5rem] flex items-center justify-center"
        )}>
          <span className="font-display font-semibold text-white block px-1 text-center animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-gold-light via-white to-gold-light break-keep text-[9px] leading-tight">
            {koreanName || name}
          </span>
        </div>
      )}

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
