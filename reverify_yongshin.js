(async () => {
    const cases = [
      {date:'1987-06-15',time:'12:00',gender:'male',name:'C1'},
      {date:'1990-01-15',time:'06:00',gender:'female',name:'C2'},
      {date:'1985-03-20',time:'23:30',gender:'male',name:'C3'},
      {date:'2000-09-01',time:'09:00',gender:'female',name:'C4'},
      {date:'1975-12-25',time:'15:00',gender:'male',name:'C5'}
    ];
    try {
      for(const c of cases){
        const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZDRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
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
        console.log('dayMaster:', s?.dayMaster, 'strength:', s?.strength, 'yongShin:', s?.yongShin);
        console.log('yongShinMethod:', s?.yongShinMethod);
        console.log('yongsin_detail:', JSON.stringify(s?.yongsin_detail));
        console.log('');
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
})();
