
import Astronomy from "astronomy-engine";

function calculateHousesManual(date: Date, observer: any) {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lst = ((gst + observer.longitude / 15.0) % 24 + 24) % 24;
  const ramc = lst * 15.0;
  const tilt = Astronomy.e_tilt(time);
  const epsRad = (tilt?.tobl || 23.43929) * Math.PI / 180;
  const phiRad = observer.latitude * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;

  // MC
  let mcDeg = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad)) * 180 / Math.PI;
  mcDeg = (mcDeg + 360) % 360;
  
  if (ramc >= 0 && ramc < 180 && mcDeg >= 180) mcDeg -= 180;
  if (ramc >= 180 && ramc < 360 && mcDeg < 180) mcDeg += 180;

  // ASC
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(epsRad) * Math.tan(phiRad) + Math.cos(epsRad) * Math.sin(ramcRad));
  let ascDeg = Math.atan2(y, x) * 180 / Math.PI;
  ascDeg = (ascDeg + 360) % 360;
  
  const diff = (ascDeg - mcDeg + 360) % 360;
  console.log("DEBUG: LST =", lst);
  console.log("DEBUG: RAMC =", ramc);
  console.log("DEBUG: Raw MC =", mcDeg);
  console.log("DEBUG: Raw ASC =", ascDeg);
  console.log("DEBUG: Diff ASC-MC =", diff);

  if (diff > 180) {
    console.log("DEBUG: Correcting ASC by +180");
    ascDeg = (ascDeg + 180) % 360;
  }

  return { asc: ascDeg, mc: mcDeg };
}

const year = 1987, month = 7, day = 17, hour = 15, minute = 30;
const offset = 10; // DST in 1987
const natalDate = new Date(Date.UTC(year, month - 1, day, hour - offset, minute));
const observer = { latitude: 37.566, longitude: 126.978 };

console.log("Natal Date UTC:", natalDate.toISOString());
const result = calculateHousesManual(natalDate, observer);
console.log("Final ASC:", result.asc);
console.log("Final MC:", result.mc);
