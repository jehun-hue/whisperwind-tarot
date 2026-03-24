(async () => {
    try {
      const c = {date:'1975-12-25',time:'15:00',gender:'male',name:'C5'};
      const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZDRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
        },
        body: JSON.stringify({
          birthInfo: c,
          question: 't',
          cards: [{ name: 'The Fool', position: 'upright' }]
        })
      });
      const d = await r.json();
      const s = d.reading?.saju_analysis;
      console.log('---', c.name, '---');
      console.log('dayMaster:', s?.dayMaster, 'strength:', s?.strength, 'yongShin:', s?.yongShin);
      console.log('yongShinMethod:', s?.yongShinMethod);
    } catch (err) {
      console.error("Error:", err);
    }
})();
