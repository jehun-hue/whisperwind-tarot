
import { calculateZiWei } from './src/lib/ziwei';

const result = calculateZiWei(1987, 6, 22, 15, 30, 'male');
console.log('--- Lim Jeheon Verification ---');
console.log('Birth Year:', 1987);
console.log('Lunar Date:', '6/22');
console.log('Birth Hour:', 15.5, '(Shen)');
console.log('MingGong:', result.mingGong);
console.log('Bureau:', result.bureau);
const mingGongPalace = result.palaces.find(p => p.branch === result.mingGong);
console.log('Stars in MingGong:', mingGongPalace?.stars.map(s => s.star));

console.log('\n--- All Palaces ---');
result.palaces.forEach(p => {
    console.log(`${p.branch}(${p.name}): ${p.stars.map(s => s.star).join(', ')}`);
});
