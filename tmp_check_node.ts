
import * as Astronomy from "https://esm.sh/astronomy-engine@2.1.19";

console.log("Astronomy keys:", Object.keys(Astronomy));
try {
    const time = Astronomy.MakeTime(new Date());
    // @ts-ignore
    console.log("MoonNode test:", Astronomy.MoonNode ? "Found" : "Not Found");
} catch (e) {
    console.log("Error checking node:", e.message);
}
