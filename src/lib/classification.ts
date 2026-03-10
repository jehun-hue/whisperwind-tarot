
export type QuestionType = "love" | "reconciliation" | "business" | "career" | "money" | "general" | "feelings";

export function classifyQuestion(q: string): QuestionType {
  const text = q.toLowerCase();

  if (text.match(/재회|다시|헤어진|전남친|전여친|reconcile|reunion|연락 올|잊었을까|심정|미련/))
    return "reconciliation";

  if (text.match(/연애|사랑|썸|결혼|짝사랑|남자|여자|상대|연락|상대방|속마음|애인|남친|여친|소개팅|솔로|인연|배우자|고백|호감|사람|사귈|데이|데이트|고백|커플|만남|결혼운/))
    return "love";

  if (text.match(/사업|창업|동업|매출|수익|사업운|거래처|프랜차이즈|가맹점|브랜드|매장|가게|CEO|경영/))
    return "business";

  if (text.match(/이직|직장|회사|취업|승진|커리어|일|퇴사|시험|합격|면접|적성|프로젝트|직원|업무|근무|동료|합격운|시험운/))
    return "career";

  if (text.match(/돈|재물|금전|투자|로또|당첨|빚|청산|지출|재테크|보너스|인센티브|자산|부자|부채|금전운/))
    return "money";

  return "general";
}
