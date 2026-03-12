
import { calculateServerZiWei } from './supabase/functions/ai-reading-v4/ziweiEngine.ts';

const input = {
    birthDate: '1987-07-17',
    birthTime: '15:30',
    gender: 'male',
    isLunar: false
};

const result = calculateServerZiWei(input);
if (result) {
    console.log('--- Server Ziwei Verification (Lim Jeheon) ---');
    console.log('MingGong:', result.mingGong);
    console.log('Bureau:', result.bureau);
    const mingGongPalace = result.palaces.find((p: any) => p.branch === result.mingGong);
    console.log('Stars in MingGong:', mingGongPalace?.main_stars);
} else {
    console.log('Calculation failed.');
}
