
import https from 'https';

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function verify() {
  const url = 'https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4';
  const payload = {
    mode: "full",
    birthInfo: {
      birthDate: "1987-07-17",
      birthTime: "15:30",
      gender: "male"
    },
    question: "verify engine",
    cards: [{ name: "The Magician", position: "1", isReversed: false }]
  };

  const body = await post(url, payload);
  const analysis = body.saju_analysis;

  console.log("\n--- [강약 판정 현장 검증] ---");
  if (!analysis) {
      console.log("실패: saju_analysis 데이터가 없습니다.", Object.keys(body));
      return;
  }
  console.log("Overall Strength:", analysis.strength);
  console.log("Strength Detail Overall:", analysis.strength_detail?.overall);
  console.log("DeukCount Reason:", analysis.strength_detail?.overall_reason);
  console.log("HeeShin:", analysis.hee_shin || analysis.heeShin);
  
  if (analysis.strength === "신강" || analysis.strength === "극신강") {
      console.log("상태: 엔진은 신강으로 판정 중입니다.");
  } else {
      console.log("상태: 엔진이 신강 판정에 실패했습니다. (현재: " + analysis.strength + ")");
  }
}

verify().catch(console.error);
