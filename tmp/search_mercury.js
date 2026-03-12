
import * as Astronomy from "astronomy-engine";

function calculate(year, month, day, hour, minute) {
  const natalDate = new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
  const time = new Astronomy.AstroTime(natalDate);
  const bodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const results = {};
  for (const b of bodies) {
    const eqj = Astronomy.GeoVector(Astronomy.Body[b], time, true);
    const ecl = Astronomy.Ecliptic(eqj);
    const lon = ((ecl.elon % 360) + 360) % 360;
    results[b] = { sign: signs[Math.floor(lon / 30)], deg: (lon % 30).toFixed(2) };
  }
  return results;
}

for (let d = 1; d <= 28; d++) {
  console.log(`1987-02-${d}:`, calculate(1987, 2, d, 15, 30).Mercury);
}
