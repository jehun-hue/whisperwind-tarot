(async () => {
    try {
      const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
        },
        body: JSON.stringify({
          birthInfo: { date: '1987-06-15', time: '12:00', gender: 'male', name: 'YONG' },
          question: 'test',
          cards: [{ name: 'The Fool', position: 'upright' }]
        })
      });
      const d = await r.json();
      const s = d.reading?.saju_analysis;
      console.log('yongShin:', s?.yongShin);
      console.log('yongShinMethod:', s?.yongShinMethod);
      console.log('yongsin_detail:', JSON.stringify(s?.yongsin_detail, null, 2));
      console.log('strength used:', s?.strength);
      console.log('myElement check - dayMaster:', s?.dayMaster);
    } catch (err) {
      console.error("Error:", err);
    }
})();
