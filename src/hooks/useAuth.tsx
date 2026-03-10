import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  useCredit: (reason: string) => Promise<boolean>;
  purchaseGrade: (sessionId: string, grade: string) => Promise<{ success: boolean; error?: string }>;
  getSessionGrade: (sessionId: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const useCredit = async (reason: string): Promise<boolean> => {
    if (!user || !profile || profile.credits <= 0) return false;

    const { error: txError } = await supabase
      .from("credit_transactions")
      .insert({ user_id: user.id, amount: -1, reason });
    if (txError) return false;

    const { error: upError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id);
    if (upError) return false;

    setProfile((p) => p ? { ...p, credits: p.credits - 1 } : p);
    return true;
  };

  const purchaseGrade = async (sessionId: string, grade: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile) return { success: false, error: "로그인이 필요합니다" };

    // 상품 정보 조회
    const { data: product } = await supabase
      .from("reading_products")
      .select("*")
      .eq("id", `grade_${grade.toLowerCase()}`)
      .single();
    
    if (!product) return { success: false, error: "상품을 찾을 수 없습니다" };
    
    // 무료 (C등급)
    if (product.credits_required === 0) {
      await supabase.from("reading_purchases").insert({
        user_id: user.id, session_id: sessionId, product_id: product.id,
        grade, credits_used: 0, payment_method: "free",
      });
      return { success: true };
    }
    
    // 크레딧 확인
    if (profile.credits < product.credits_required) {
      return { success: false, error: `크레딧이 부족합니다 (필요: ${product.credits_required}, 보유: ${profile.credits})` };
    }
    
    // 크레딧 차감
    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id: user.id, amount: -product.credits_required,
      reason: `${grade}등급 리딩 구매 (세션: ${sessionId.slice(0, 8)})`,
    });
    if (txError) return { success: false, error: "결제 처리 중 오류" };
    
    const { error: upError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - product.credits_required })
      .eq("id", user.id);
    if (upError) return { success: false, error: "크레딧 업데이트 오류" };
    
    // 구매 기록
    await supabase.from("reading_purchases").insert({
      user_id: user.id, session_id: sessionId, product_id: product.id,
      grade, credits_used: product.credits_required, payment_method: "credit",
    });
    
    setProfile(p => p ? { ...p, credits: p.credits - product.credits_required } : p);
    return { success: true };
  };

  const getSessionGrade = async (sessionId: string): Promise<string> => {
    if (!user) return "C";
    const { data } = await supabase
      .from("reading_purchases")
      .select("grade")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.grade || "C";
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile, useCredit, purchaseGrade, getSessionGrade }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
