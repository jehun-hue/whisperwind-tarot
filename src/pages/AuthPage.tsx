import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("로그인 성공!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("가입 확인 이메일을 보내드렸습니다. 이메일을 확인해주세요.");
      }
    } catch (err: any) {
      toast.error(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google 로그인에 실패했습니다.");
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("이메일을 입력해주세요.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("비밀번호 재설정 이메일을 보냈습니다.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mb-3 text-3xl">☽</div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            AI 통합 점술 상담
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? "로그인하고 심화 분석을 받아보세요" : "회원가입하고 무료 크레딧 3개를 받으세요"}
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <Button
              variant="outline"
              className="w-full rounded-xl border-border/50 bg-secondary/50"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </Button>

            <div className="relative">
              <Separator className="bg-border/30" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                또는
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {!isLogin && (
                <div>
                  <Label className="text-xs text-muted-foreground">이름</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 rounded-xl border-border/50 bg-secondary/50"
                    placeholder="홍길동"
                    required={!isLogin}
                  />
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">이메일</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 rounded-xl border-border/50 bg-secondary/50"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">비밀번호</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 rounded-xl border-border/50 bg-secondary/50"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-gold hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gold hover:underline"
              >
                {isLogin ? "회원가입" : "로그인"}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
