import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Locale } from "@/config/locales";

const i18n: Record<Locale, { login: string; credits: string }> = {
  kr: { login: "로그인", credits: "크레딧" },
  jp: { login: "ログイン", credits: "クレジット" },
  us: { login: "Sign In", credits: "Credits" },
};

interface UserHeaderProps {
  locale?: Locale;
}

export default function UserHeader({ locale = "kr" }: UserHeaderProps) {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const t = i18n[locale];

  if (loading) return null;

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-3 px-4 py-3">
      <Badge variant="outline" className="border-gold/30 text-gold gap-1.5 rounded-full px-3 py-1">
        <Coins className="h-3 w-3" />
        <span className="text-xs font-medium">{profile?.credits ?? 0} {t.credits}</span>
      </Badge>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        {profile?.display_name || user.email}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-foreground"
        onClick={signOut}
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
