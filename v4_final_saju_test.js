async function t(n, d, ti) {
  let r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: d, time: ti, gender: 'male', name: n },
      question: 'test',
      cards: [{ name: 'The Fool', position: 'upright' }]
    })
  });
  let j = await r.json();
  let s = j.reading?.saju_analysis;
  console.log(`${n} ${d} ${ti}`);
  console.log('  strength:', s?.strength);
  console.log('  strength_detail:', JSON.stringify(s?.strength_detail)?.substring(0, 150));
  console.log('  yongShin:', s?.yongShin);
}

async function main() {
  await t('갑자일주(가을)', '1984-09-14', '06:00');
  await t('정화여름(득령)', '1987-06-15', '12:00');
  await t('임수겨울(득령)', '1992-12-20', '22:00');
}

main();
