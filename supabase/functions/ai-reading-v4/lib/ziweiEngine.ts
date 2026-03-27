/**
 * ziweiEngine.ts — Adapter layer
 * 기존 인터페이스를 유지하면서 V2(최신) 엔진으로 위임
 */

import {
  calculateZiWei,
  PALACES,
  MAJOR_STARS,
  AUXILIARY_STARS,
  type PalaceInfo,
  type StarPlacement,
  type MajorPeriod,
  type MinorPeriod,
  type TransformationType,
  type ZiWeiResult,
  STAR_PALACE_MEANINGS,
} from './ziweiEngineV2.ts';

// V2 엔진에서 모든 것을 가져옴 (이름 매핑 포함)
export {
  calculateZiWei,
  PALACES as PALACE_NAMES,
  MAJOR_STARS,
  AUXILIARY_STARS,
  type PalaceInfo,
  type StarPlacement,
  type MajorPeriod,
  type MinorPeriod,
  type TransformationType,
  STAR_PALACE_MEANINGS,
};

// 기존 integratedReadingEngine.ts 및 다른 파일에서 요구하는 인터페이스 호환성 유지
export { calculateZiWei as calculateZiwei };
export { calculateZiWei as calculateServerZiWei };
export type ServerZiWeiResult = ZiWeiResult;
export type ZiweiResult = ZiWeiResult;
