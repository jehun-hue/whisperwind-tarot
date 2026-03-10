const url = "https://gbmiciumkbsyamdbaddr.supabase.co/rest/v1/reading_sessions?select=id%2Csaju_data%2Cbirth_date%2Cbirth_time&order=created_at.desc&limit=1";
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
