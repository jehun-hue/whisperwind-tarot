import { STEM_ELEMENT_KR } from "./lib/fiveElements.ts";
export async function testConstants() {
  console.log("STEM_ELEMENT_KR:", JSON.stringify(STEM_ELEMENT_KR));
  return { STEM_ELEMENT_KR };
}
