
import * as Astronomy from "astronomy-engine";

function calculate(year, month, day, hour, minute) {
  const natalDate = new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
  const time = new Astronomy.AstroTime(natalDate);
  const observer = new Astronomy.Observer(37.5665, 126.9780, 0); 
  
  const bodies = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"
  ];
  const bodyNames = ["태양", "달", "수성", "금성", "화성", "목성", "토성"];

  const results = {};
  for (let i = 0; i < bodies.length; i++) {
    const body = Astronomy.Body[bodies[i]];
    try {
      // For general geocentric ecliptic longitude:
      // Use GeoVector (EQJ) -> Ecliptic (ECL) -> ion (Longitude)
      const eqj = Astronomy.GeoVector(body, time, true); // true for aberration
      const ecl = Astronomy.Ecliptic(eqj);
      
      const lon = ((ecl.elon % 360) + 360) % 360;
      const signIdx = Math.floor(lon / 30);
      const degree = lon % 30;
      
      const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
      results[bodyNames[i]] = `${signs[signIdx]} ${degree.toFixed(2)}° (Long: ${lon.toFixed(4)}°)`;
    } catch (e) {
      results[bodyNames[i]] = "Error: " + e.message;
    }
  }
  return results;
}

try {
  const output = calculate(1987, 7, 17, 15, 30);
  process.stdout.write(JSON.stringify(output, null, 2));
} catch (e) {
  console.error(e);
}
