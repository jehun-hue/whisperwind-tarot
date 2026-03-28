
import { calculateSaju } from "../supabase/functions/ai-reading-v4/lib/sajuEngine.ts";
import { 
  STEM_ELEMENT_HANJA, 
  GENERATES_HANJA, 
  CONTROLS_HANJA, 
  GENERATED_BY_HANJA 
} from "../supabase/functions/ai-reading-v4/lib/fiveElements.ts";

// Aliases as requested by user
const KR_EL_MAP = STEM_ELEMENT_HANJA;
const GEN = GENERATES_HANJA;
const CON = CONTROLS_HANJA;
const GEN_BY = GENERATED_BY_HANJA;

function checkHiddenChars(obj: Record<string, string>, name: string) {
    console.log(`\n--- Checking ${name} for hidden characters ---`);
    for (const [key, value] of Object.entries(obj)) {
        const keyEscaped = JSON.stringify(key);
        const valEscaped = JSON.stringify(value);
        console.log(`Key: ${keyEscaped} -> Value: ${valEscaped}`);
        
        // Detailed char code check for suspicious keys
        if (key.length !== 1) {
            console.log(`  [WARNING] Key ${keyEscaped} has length ${key.length}`);
            for (let i = 0; i < key.length; i++) {
                console.log(`    Char at ${i}: ${key.charCodeAt(i)}`);
            }
        }
    }
}

async function runTest() {
    console.log("Starting S-6 Yongsin Runtime Mapping Test...");

    // 1. Check constants
    checkHiddenChars(KR_EL_MAP, "KR_EL_MAP");
    checkHiddenChars(GEN, "GEN");
    checkHiddenChars(CON, "CON");
    checkHiddenChars(GEN_BY, "GEN_BY");

    // 2. Run Test Case
    // 1987-07-17 15:30 Male
    // In KST (UTC+9), 15:30. 
    // calculateSaju(year, month, day, hour, minute, gender)
    console.log("\n--- Running Saju Calculation for 1987-07-17 15:30 M ---");
    const result = calculateSaju(1987, 7, 17, 15, 30, 'M');

    const dayMaster = result.dayMaster;
    const dmElementHanja = KR_EL_MAP[dayMaster];
    
    console.log(`Year:  ${result.year.stem}${result.year.branch}`);
    console.log(`Month: ${result.month.stem}${result.month.branch}`);
    console.log(`Day:   ${result.day.stem}${result.day.branch} (Day Master: ${dayMaster})`);
    console.log(`Hour:  ${result.hour.stem}${result.hour.branch}`);
    console.log(`Day Master Element (Hanja): ${dmElementHanja}`);

    // 3. Verify Mapping Logic
    console.log("\n--- Verifying Yongsin Mapping ---");
    
    const genVal = GEN[dmElementHanja];
    const conVal = CON[dmElementHanja];
    const genByVal = GEN_BY[dmElementHanja];

    console.log(`GEN[${dmElementHanja}] -> ${genVal}`);
    console.log(`CON[${dmElementHanja}] -> ${conVal}`);
    console.log(`GEN_BY[${dmElementHanja}] -> ${genByVal}`);

    // Pillar Check
    const expectedPillars = 
        result.year.stem === "丁" && result.year.branch === "卯" &&
        result.month.stem === "丁" && result.month.branch === "未" &&
        result.day.stem === "丁" && result.day.branch === "卯" &&
        result.hour.stem === "戊" && result.hour.branch === "申";

    if (expectedPillars) {
        console.log("\n[SUCCESS] Pillars matched: 丁卯 / 丁未 / 丁卯 / 戊申");
    } else {
        console.log("\n[FAILURE] Pillars mismatch.");
    }
}

runTest().catch(console.error);
