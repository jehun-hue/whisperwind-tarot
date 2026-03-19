import { calculateServerAstrology } from './lib/astrologyEngine.ts';

async function verify() {
  const result = await calculateServerAstrology(
    1987, 7, 17, 15, 30,
    37.5665,
    126.9780
  );
  console.log(JSON.stringify(result, null, 2));
}

verify().catch(console.error);
