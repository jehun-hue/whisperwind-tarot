const url = "https://gbmiciumkbsyamdbaddr.supabase.co/rest/v1/reading_sessions";
const key = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

const body = {
    question: "UI 모방 테스트",
    question_type: "종합",
    status: "pending",
    cards: [
        { "id": 1, "name": "The Magician", "korean": "마법사", "isReversed": false, "position": "현재 상황" },
        { "id": 2, "name": "The High Priestess", "korean": "고위 여사제", "isReversed": false, "position": "핵심 문제" },
        { "id": 3, "name": "The Empress", "korean": "여황제", "isReversed": false, "position": "숨겨진 원인" }
    ],
    saju_data: { "test": "data" }
};

fetch(url, {
    method: "POST",
    headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    },
    body: JSON.stringify(body)
})
    .then(res => res.json())
    .then(data => {
        const id = data[0].id;
        console.log("Created ID:", id);
        setTimeout(() => {
            fetch(`${url}?id=eq.${id}&select=status,ai_reading`, {
                headers: { "apikey": key, "Authorization": "Bearer " + key }
            }).then(r=>r.json()).then(d=>console.log("Status after 5s:", d[0]));
        }, 5000);
    });
