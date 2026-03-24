(async () => {
    const cases = [
      {date:'1987-06-15',time:'',gender:'male',name:'E1_시간미입력'},
      {date:'1901-01-15',time:'12:00',gender:'male',name:'E2_1901년'},
      {date:'1940-08-15',time:'06:00',gender:'female',name:'E3_1940년'},
      {date:'2050-03-01',time:'09:00',gender:'male',name:'E4_2050년'},
      {date:'2000-02-29',time:'23:59',gender:'female',name:'E5_윤일심야'}
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
            question: 't',
            cards: [{ name: 'The Fool', position: 'upright' }]
          })
        });
        const d = await r.json();
        const s = d.reading?.saju_analysis;
        console.log(`--- ${c.name} ---`);
        console.log('dayMaster:', s?.dayMaster, 'strength:', s?.strength, 'yongShin:', s?.yongShin);
        console.log('narrative:', s?.narrative ? s.narrative.substring(0, 30) : 'none');
        console.log('error:', d.error || 'none');
      }
    } catch (err) {
      console.error("Error:", err);
    }
})();
