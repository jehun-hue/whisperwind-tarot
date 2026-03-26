const fs = require("fs");
const file = "supabase/functions/ai-reading-v4/lib/interpretations/index.ts";
let content = fs.readFileSync(file, "utf8");
console.log("BEFORE:", content);
content = content.replace(
  'export * from "./iljuMeanings.ts";',
  '// export * from "./iljuMeanings.ts"; // ILJU_MEANINGS duplicate fix'
);
fs.writeFileSync(file, content);
console.log("AFTER:", content);
