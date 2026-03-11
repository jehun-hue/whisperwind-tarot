const url = "https://gbmiciumkbsyamdbaddr.supabase.co/rest/v1/reading_sessions";
const key = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

const body = {
    question: "테스트 질문 " + new Date().toISOString(),
    question_type: "종합",
    status: "pending",
    cards: []
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
        console.log("Created Session:", JSON.stringify(data[0], null, 2));
        const sessionId = data[0].id;
        console.log("Waiting 3 seconds to check status change...");
        setTimeout(() => {
            fetch(`${url}?id=eq.${sessionId}&select=status,ai_reading`, {
                headers: {
                    "apikey": key,
                    "Authorization": "Bearer " + key
                }
            })
                .then(res => res.json())
                .then(checkData => {
                    console.log("Session Status After 3s:", JSON.stringify(checkData[0], null, 2));
                });
        }, 3000);
    })
    .catch(err => console.error(err));
