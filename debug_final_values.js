(async () => {
  try {
    let r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
      },
      body: JSON.stringify({
        birthInfo: { date: '1987-06-15', time: '12:00', gender: 'male', name: '값확인' },
        question: 'test',
        cards: [{ name: 'The Fool', position: 'upright' }]
      })
    });
    let d = await r.json();
    let s = d.reading?.saju_analysis;
    console.log('=== saju_analysis 직접 값 확인 ===');
    console.log('dayMaster 값:', JSON.stringify(s?.dayMaster));
    console.log('strength 값:', JSON.stringify(s?.strength));
    console.log('strength_detail 값:', JSON.stringify(s?.strength_detail)?.substring(0, 200));
    console.log('=== reading 최상위 키 ===');
    console.log(Object.keys(d.reading || {}).join(', '));
  } catch (err) {
    console.error("Error:", err);
  }
})();
