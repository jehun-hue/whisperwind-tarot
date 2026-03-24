(async () => {
  try {
    let r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
      },
      body: JSON.stringify({
        birthInfo: { date: '1987-06-15', time: '12:00', gender: 'male', name: 'ELEM' },
        question: 'test',
        cards: [{ name: 'The Fool', position: 'upright' }]
      })
    });
    let d = await r.json();
    let s = d.reading?.saju_analysis;
    console.log('pillars:', JSON.stringify(s?.pillars, null, 2));
    console.log('elements:', JSON.stringify(s?.elements, null, 2));
    console.log('strength_detail:', JSON.stringify(s?.strength_detail, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
})();
