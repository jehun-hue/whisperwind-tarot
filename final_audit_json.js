(async () => {
    const cases = [
      {date:'1987-06-15',time:'12:00',gender:'male',name:'Case1'},
      {date:'1990-01-15',time:'06:00',gender:'female',name:'Case2'},
      {date:'1985-03-20',time:'23:30',gender:'male',name:'Case3'},
      {date:'2000-09-01',time:'09:00',gender:'female',name:'Case4'},
      {date:'1975-12-25',time:'15:00',gender:'male',name:'Case5'}
    ];
    try {
      for(const c of cases){
        const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
          },
          body: JSON.stringify({
            birthInfo: c,
            question: 'test',
            cards: [{ name: 'The Fool', position: 'upright' }]
          })
        });
        const d = await r.json();
        const s = d.reading?.saju_analysis;
        console.log(`=== ${c.name} ===`);
        console.log(JSON.stringify({
          pillars: s?.pillars,
          dayMaster: s?.dayMaster,
          elements: s?.elements,
          strength: s?.strength,
          strength_detail: s?.strength_detail,
          yongShin: s?.yongShin
        }, null, 2));
      }
    } catch (err) {
      console.error("Error:", err);
    }
})();
