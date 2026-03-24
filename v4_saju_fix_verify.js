const start = Date.now();

async function check(name, question, birthInfo) {
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: birthInfo,
      question: question,
      cards: [{name:'The Star',position:'upright'},{name:'The Tower',position:'reversed'},{name:'Ace of Wands',position:'upright'}],
      mode: 'data-only' // Only check calculated data if possible, or just raw output
    })
  });
  const d = await r.json();
  
  // Note: ai-reading-v4 returns integrated results. We need to check if 'interactions' or 'debug' info is available.
  // Assuming 'debug_prompt' or similar logs the interactions. 
  // Actually, let's just check the returned reading for specific terms if it's not data-only.
  // Wait, I should check if the function returns the raw saju data.
  
  console.log(`\n=== Verification: ${name} ===`);
  // If we can't see the internal data, we'll have to rely on the fact that the code is correct.
  // But wait, the previous logs showed 'debug_prompt' contains the prompt which might contain the interactions.
  console.log(`Interactions found in debug: ${d.debug_prompt?.includes('자형') ? 'YES' : 'NO'}`);
}

// Case 1: 진(辰) 하나인 사주 (1988-04-10 10:30) 
// 1988 is Mu-Jin (辰). April (usually Jin or Sa). 
// Let's find a date with exactly ONE Jin.
await check('Single Jin Test', '내 성격 어때?', { date: '1988-01-10', time: '10:30', gender: 'male' });

// Case 2: 진(辰) 두 개인 사주 (1988-04-10 08:30)
// 1988 (Jin) + Jin month or Jin hour.
await check('Double Jin Test', '내 성격 어때?', { date: '1988-04-10', time: '08:30', gender: 'male' });
