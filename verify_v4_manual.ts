
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const body = {
  question: "제헌 데이터 런타임 검증",
  questionType: "종합",
  memo: "테스트 메모",
  cards: [{ id: 1, name: "The Magician", korean: "마법사", isReversed: false }],
  birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: "male", isLunar: false },
  locale: "kr"
};

async function test() {
  console.log("Testing ai-reading-v4 call...");
  const { data, error } = await supabase.functions.invoke("ai-reading-v4", {
    body
  });

  if (error) {
    console.error("Invoke Error:", error);
    return;
  }

  console.log("Success! Response Data:");
  console.log(JSON.stringify(data, null, 2));
}

test();
