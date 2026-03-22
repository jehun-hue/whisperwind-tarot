
import https from 'https';

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname, port: 443, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function verify() {
  const url = 'https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4';
  const payload = {
    mode: "full",
    birthInfo: { birthDate: "1987-07-17", birthTime: "15:30", gender: "male", longitude: 126.978, latitude: 37.566 },
    question: "test" + Date.now(),
    cards: [{ name: "The Magician", position: "1", isReversed: false }]
  };

  const body = await post(url, payload);
  console.log('--- DEBUG START ---');
  console.log('STATUS:', body.status);
  console.log('ERROR:', body.error);
  console.log('MSG:', body.error_message);
  console.log('TOP_KEYS:', Object.keys(body).join(','));
  if (body.analyses) console.log('ANALYSES_SYSTEMS:', Object.keys(body.analyses).join(','));
  
  const a = body.analyses?.astrology;
  if (a) {
    console.log('--- ASTROLOGY DATA FOUND ---');
    (a.planet_positions || []).forEach(p => {
      console.log(`${p.planet}: ${p.degree.toFixed(2)} ${p.signEnglish || p.sign}`);
    });
  } else {
    console.log('--- ASTROLOGY DATA MISSING ---');
  }
}

verify().catch(console.error);
