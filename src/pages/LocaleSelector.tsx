import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import heroBg from "@/assets/tarot-hero-bg.jpg";

const locales = [
  { code: "kr", flag: "🇰🇷", label: "한국어", desc: "타로 + 사주 + 점성술 + 자미두수" },
  { code: "jp", flag: "🇯🇵", label: "日本語", desc: "タロット＋占星術リーディング" },
  { code: "us", flag: "🇺🇸", label: "English", desc: "Tarot + Astrology Spiritual Reading" },
];

export default function LocaleSelector() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="animate-float mb-4 text-5xl">☽</div>
          <span className="font-display text-sm italic tracking-[0.3em] text-gold-light">
            AI divination
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Choose Your Language
          </h1>
          <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </motion.div>

        <div className="grid w-full max-w-md gap-4">
          {locales.map((locale, idx) => (
            <motion.button
              key={locale.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/${locale.code}`)}
              className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-xl transition-all hover:border-gold/30 hover:glow-gold"
            >
              <span className="text-4xl">{locale.flag}</span>
              <div className="text-left">
                <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                  {locale.label}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{locale.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
