
import { calculateJulianDay } from "./lib/julianDay.ts";

const d1 = new Date(Date.UTC(1987, 7, 4, 6, 30)); // 1987-08-04 06:30 UTC
const jd1 = calculateJulianDay(d1);
console.log("1987-08-04 06:30 UTC JD:", jd1);
console.log("1987-08-04 idx (jd1 + 0.5 + 49) % 60:", Math.floor(jd1 + 0.5 + 49) % 60);

const d2 = new Date(Date.UTC(2000, 10, 13, 15, 0)); // 2000-11-13 15:00 UTC
const jd2 = calculateJulianDay(d2);
console.log("2000-11-13 15:00 UTC JD:", jd2);
console.log("2000-11-13 idx (jd2 + 0.5 + 49) % 60:", Math.floor(jd2 + 0.5 + 49) % 60);
