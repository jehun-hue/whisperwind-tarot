(async () => {
    console.log("Waiting 30 seconds for deploy propagation...");
    await new Promise(r => setTimeout(r, 30000));
    try {
      const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZDRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
        },
        body: JSON.stringify({
          birthInfo: { date: '1987-06-15', time: '12:00', gender: 'male', name: 'SOLAR2' },
          question: 'test',
          cards: [{ name: 'The Fool', position: 'upright' }]
        })
      });
      const d = await r.json();
      const s = d.reading?.saju_analysis;
      console.log('--- FINAL VERIFY ---');
      console.log('solarTimeApplied:', s?.solarTimeApplied);
      console.log('solarTimeNote:', s?.solarTimeNote);
      console.log('strength:', s?.strength);
      console.log('yongShin:', s?.yongShin);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
})();
