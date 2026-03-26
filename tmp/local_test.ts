// tmp/local_test.ts
import { buildReadingPrompt } from "../supabase/functions/ai-reading-v4/lib/promptBuilder.ts";

const userInfo = { name: "Test User", question: "Test Question" };
const saju = { dayMaster: "甲", yongShin: "목", fortune: { rating: "A", score: 80 } };
const prompt = buildReadingPrompt(userInfo, saju as any, {} as any, {} as any, {} as any, { cards: [] } as any, {} as any, {} as any);
console.log("PROMPT BUILT:", prompt.slice(0, 100));
