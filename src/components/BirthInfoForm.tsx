import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User, Calendar, Clock, MapPin } from "lucide-react";

export interface BirthInfo {
  name: string;
  gender: "male" | "female";
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm or ""
  birthPlace: string;
  isLunar: boolean;
}

interface BirthInfoFormProps {
  onSubmit: (info: BirthInfo) => void;
  onSkip: () => void;
}

const BIRTH_HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  const jiMap = ["자시", "축시", "축시", "인시", "인시", "묘시", "묘시", "진시", "진시", "사시", "사시", "오시", "오시", "미시", "미시", "신시", "신시", "유시", "유시", "술시", "술시", "해시", "해시", "자시"];
  return { value: `${h}:00`, label: `${h}:00 (${jiMap[i]})` };
});

export default function BirthInfoForm({ onSubmit, onSkip }: BirthInfoFormProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [isLunar, setIsLunar] = useState(false);

  const canSubmit = birthDate.length > 0;

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
            <h2 className="font-display text-xl font-semibold text-foreground">
              출생 정보 입력
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              사주 분석을 위해 출생 정보를 입력해주세요
            </p>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> 이름/닉네임
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                placeholder="이름/닉네임을 입력해주세요"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> 성별
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
                    {g === "female" ? "👩 여성" : "👨 남성"}
                  </button>
                ))}
              </div>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> 생년월일
              </Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground"
                max={new Date().toISOString().split("T")[0]}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={isLunar}
                  onCheckedChange={setIsLunar}
                  className="data-[state=checked]:bg-primary"
                />
                <span className="text-xs text-muted-foreground">
                  {isLunar ? "음력" : "양력"}
                </span>
              </div>
            </div>

            {/* Birth Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> 출생 시간
              </Label>
              <Select value={birthTime} onValueChange={setBirthTime}>
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground">
                  <SelectValue placeholder="모르면 비워두세요" />
                </SelectTrigger>
                <SelectContent>
                  {BIRTH_HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Birth Place */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> 출생지
              </Label>
              <Input
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                placeholder="예: 서울, 부산 (선택사항)"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-primary to-gold text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                onClick={() =>
                  onSubmit({ name, gender, birthDate, birthTime, birthPlace, isLunar })
                }
                disabled={!canSubmit}
              >
                ✦ 사주 분석 포함하여 진행
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-xl text-muted-foreground hover:text-foreground"
                onClick={onSkip}
              >
                건너뛰고 타로만 진행
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
