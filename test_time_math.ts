
function test(hour, minute, longitude) {
  const dstOffset = 0;
  const kstToUtcMinutes = -9 * 60;
  const longitudeCorrectionMinutes = (longitude - 135) * 4;
  const totalOffsetMinutes = longitudeCorrectionMinutes + dstOffset;
  
  const solarUtcMinutes = Math.round((hour * 60 + minute + totalOffsetMinutes) + kstToUtcMinutes);
  const correctedDate = new Date(Date.UTC(2000, 0, 1, 0, solarUtcMinutes));
  
  const kstSolarDate = new Date(correctedDate.getTime() + 9 * 60 * 60000);
  const correctedHour = kstSolarDate.getUTCHours();
  const correctedMinute = kstSolarDate.getUTCMinutes();
  
  console.log({ 
    input: {hour, minute, longitude},
    longitudeCorrectionMinutes,
    solarUtcMinutes,
    iso: correctedDate.toISOString(),
    kstSolarHour: correctedHour,
    kstSolarMinute: correctedMinute
  });
}

test(23, 30, 127.5);   // Expect 23:00
test(23, 30, 126.98);  // Expect 22:58 -> 22
test(23, 30, 126.978); // Expect 22:57 -> 22
