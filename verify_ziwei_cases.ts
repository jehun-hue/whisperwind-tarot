
import { calculateZiWei } from './src/lib/ziwei';

const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

console.log('\n--- Case: Lianzhen + Tanlang in Si/Hai? ---');
for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 30; d++) {
        const r = calculateZiWei(1984, m, d, 12, 0, 'male');
        const ziPos = r.palaces.findIndex(p => p.stars.some(s => s.star === '자미'));
        if (ziPos === 1 || ziPos === 7) {
            const meetPos = r.palaces.findIndex(p => p.stars.some(s => s.star === '염정') && p.stars.some(s => s.star === '탐랑'));
            if (meetPos !== -1) {
                console.log(`Ziwei at ${BRANCHES[ziPos]} -> Lianzhen+Tanlang at ${BRANCHES[meetPos]}`);
            }
        }
    }
}
