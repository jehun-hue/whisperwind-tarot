import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Calendar, Clock, MapPin } from "lucide-react";
import type { BirthInfo } from "@/components/BirthInfoForm";
import type { LocaleConfig } from "@/config/locales";

interface LocalizedBirthInfoFormProps {
  config: LocaleConfig;
  onSubmit: (info: BirthInfo) => void;
  onSkip: () => void;
}

const unknownLabel: Record<string, string> = {
  kr: "모름",
  jp: "不明",
  us: "Unknown",
};

export default function LocalizedBirthInfoForm({ config, onSubmit, onSkip }: LocalizedBirthInfoFormProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [birthPlace, setBirthPlace] = useState("");
  const [isLunar, setIsLunar] = useState(false);

  const canSubmit = birthDate.length > 0;

  const handleUnknownToggle = () => {
    setBirthTimeUnknown(!birthTimeUnknown);
    if (!birthTimeUnknown) setBirthTime("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-2 text-2xl">✧</div>
            <h2 className="text-xl font-semibold text-foreground"
                style={{ fontFamily: config.displayFont }}>
              {config.birthTitle}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {config.birthSubtitle}
            </p>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> {config.nameLabel ?? "이름"}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                placeholder={config.namePlaceholder ?? "이름을 입력해주세요 (선택사항)"}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> {config.genderLabel}
              </Label>
              <div className="flex gap-2">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      gender === g
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/50 bg-background/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {config.genderOptions[g]}
                  </button>
                ))}
              </div>
            </div>

            {/* Birth Date + Calendar Toggle */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> {config.birthDateLabel}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="flex-1 rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground"
                  max={new Date().toISOString().split("T")[0]}
                />
                {/* Lunar/Solar toggle as segmented button */}
                <div className="flex rounded-xl border border-border/50 overflow-hidden">
                  <button
                    onClick={() => setIsLunar(false)}
                    className={`px-3 py-2 text-xs font-medium transition-all ${
                      !isLunar
                        ? "bg-primary/20 text-primary"
                        : "bg-background/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {config.calendarToggle.solar}
                  </button>
                  <button
                    onClick={() => setIsLunar(true)}
                    className={`px-3 py-2 text-xs font-medium transition-all ${
                      isLunar
                        ? "bg-primary/20 text-primary"
                        : "bg-background/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {config.calendarToggle.lunar}
                  </button>
                </div>
              </div>
            </div>

            {/* Birth Time - Direct Input + Unknown Button */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {config.birthTimeLabel}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={birthTime}
                  onChange={(e) => {
                    setBirthTime(e.target.value);
                    if (e.target.value) setBirthTimeUnknown(false);
                  }}
                  disabled={birthTimeUnknown}
                  className={`flex-1 rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground ${
                    birthTimeUnknown ? "opacity-40" : ""
                  }`}
                  placeholder={config.birthTimePlaceholder}
                />
                <Button
                  type="button"
                  variant={birthTimeUnknown ? "default" : "outline"}
                  size="sm"
                  onClick={handleUnknownToggle}
                  className={`rounded-xl px-4 text-xs whitespace-nowrap ${
                    birthTimeUnknown
                      ? "bg-primary/20 text-primary border-primary/50"
                      : "border-border/50 text-muted-foreground"
                  }`}
                >
                  {unknownLabel[config.locale]}
                </Button>
              </div>
            </div>

            {/* Birth Place */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {config.birthPlaceLabel}
              </Label>
              <Input
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                placeholder={config.birthPlacePlaceholder}
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-primary to-gold text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                onClick={() => {
                  if (!gender) {
                    const msg = config.locale === "kr" ? "성별을 선택해주세요" : config.locale === "jp" ? "性別を選択してください" : "Please select your gender";
                    alert(msg);
                    return;
                  }
                  onSubmit({
                    name,
                    gender: gender as "male" | "female",
                    birthDate,
                    birthTime: birthTimeUnknown ? "" : birthTime,
                    birthPlace,
                    isLunar,
                  })
                }}
                disabled={!canSubmit}
              >
                {config.birthSubmitButton}
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-xl text-muted-foreground hover:text-foreground"
                onClick={onSkip}
              >
                {config.birthSkipButton}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
