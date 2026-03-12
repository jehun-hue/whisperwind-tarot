
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
    results[b] = `${signs[Math.floor(lon / 30)]} ${(lon % 30).toFixed(2)}°`;
  }
  return results;
}

console.log("1987-07-17 15:30 KST:", calculate(1987, 7, 17, 15, 30));
console.log("1987-01-17 15:30 KST:", calculate(1987, 1, 17, 15, 30));
console.log("1987-02-17 15:30 KST:", calculate(1987, 2, 17, 15, 30));
