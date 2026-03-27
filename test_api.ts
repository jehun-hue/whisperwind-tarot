/**
 * Lightweight API Verification Script
 */

const ENDPOINT = 'https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTExNjE2MDMsImV4cCI6MjAyNjc1NzYwM30.0XU_nS_K_T_Y_Z_X_W_V_U_T_S_R_Q_P_O_N_M_L_K_J_I_H_G_F_E_D_C_B_A";

async function testCase(name: string, input: any) {
  console.log(`\n[Test] ${name}...`);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ mode: 'saju-only', ...input }),
    });

    if (!res.ok) {
        console.error(`  FAILED: HTTP ${res.status}`);
        return;
    }

    const data = await res.json();
    if (data.status === 'ok' && data.sajuResult) {
      console.log('  Raw Result:', JSON.stringify(data.sajuResult, null, 2));
      const p = data.sajuResult.pillars;
      if (p && p.year) {
        console.log(`  SUCCESS! Pillars: ${p.year.join('')} ${p.month.join('')} ${p.day.join('')} ${p.hour.join('')}`);
      }
      console.log(`  DayMaster: ${data.sajuResult.dayMaster}, Strength: ${data.sajuResult.strength}`);
    } else {
      console.error(`  FAILED: ${JSON.stringify(data)}`);
    }
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
  }
}

async function main() {
  await testCase('1990-05-15 14:30 M (Solar)', { year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: 'male' });
  await testCase('1988-04-15 06:00 F (Lunar -> 1988-05-30)', { year: 1988, month: 4, day: 15, hour: 6, gender: 'female', isLunar: true });
}

main();
