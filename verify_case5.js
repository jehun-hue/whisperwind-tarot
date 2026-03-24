(async () => {
    try {
      const c = {date:'1975-12-25',time:'15:00',gender:'male',name:'Case5_겨울토'};
      const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhDRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
        },
        body: JSON.stringify({
          birthInfo: c,
          question: 'test',
          cards: [{ name: 'The Fool', position: 'upright' }]
        })
      });
      const d = await r.json();
      const s = d.reading?.saju_analysis;
      console.log('---',c.name,'---');
      console.log('pillars:',JSON.stringify(s?.pillars));
      console.log('dayMaster:',s?.dayMaster);
      console.log('strength:',s?.strength);
      console.log('strength_detail:',JSON.stringify(s?.strength_detail));
      console.log('elements:',JSON.stringify(s?.elements));
      console.log('yongShin:',s?.yongShin);
      console.log('interactions count:', s?.interactions?.length);
    } catch (err) {
      console.error("Error:", err);
    }
})();
