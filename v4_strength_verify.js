(async () => {
  async function checkStrength(name, birthInfo) {
    let r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
      },
      body: JSON.stringify({
        birthInfo: birthInfo,
        question: '내 사주 강약이 어때?',
        cards: [{ name: 'The Star', position: 'upright' }]
      })
    });
    let d = await r.json();
    let s = d.reading?.saju_analysis || d.reading?.saju;
    console.log(`\n=== Strength Check: ${name} ===`);
    console.log(`DayMaster: ${s?.dayMaster}`);
    console.log(`Strength Result: ${s?.strength}`);
    // If we have detailed scores in the response (we don't yet, but we have 'strength')
  }

  // Case 1: Shin-Gang possible (Wood DM in Spring)
  await checkStrength('Spring Wood (Shin-Gang?)', { date: '1984-03-10', time: '10:30', gender: 'male' });

  // Case 2: Shin-Yak possible (Fire DM in Winter)
  await checkStrength('Winter Fire (Shin-Yak?)', { date: '1984-12-10', time: '10:30', gender: 'male' });

})();
