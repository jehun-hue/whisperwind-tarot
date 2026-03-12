const Astronomy = require("astronomy-engine");

const body = Astronomy.Body.Sun;
const date = new Date();
const time = new Astronomy.AstroTime(date);
const observer = new Astronomy.Observer(37.5665, 126.9780, 0);

try {
  console.log("Calling with AstroTime");
  const eq1 = Astronomy.Equator(body, time, observer, true, true);
  console.log("Success with AstroTime:");
} catch(e) {
  console.error("Error with AstroTime:", e.message);
}

try {
  console.log("Calling with Date");
  const eq2 = Astronomy.Equator(body, date, observer, true, true);
  console.log("Success with Date:");
} catch(e) {
  console.error("Error with Date:", e.message);
}
