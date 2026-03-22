
import Astronomy from "astronomy-engine";

const natalDate = new Date(Date.UTC(1987, 6, 17, 5, 30, 0));
const time = Astronomy.MakeTime(natalDate);
console.log("time.tt:", time.tt);
console.log("time.ut:", time.ut);
console.log("date.getTime():", natalDate.getTime());
