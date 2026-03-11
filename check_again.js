const url = "https://gbmiciumkbsyamdbaddr.supabase.co/rest/v1/reading_sessions?id=eq.29e86e84-f37f-4080-a868-a47a627a1598&select=status,ai_reading";
const key = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

fetch(url, {
    headers: {
        "apikey": key,
        "Authorization": "Bearer " + key
    }
})
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
