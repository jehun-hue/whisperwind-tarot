
const { createClient } = require('@supabase/supabase-js');

async function checkLatestReading() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('reading_sessions')
    .select('id, ai_reading, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching session:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Latest Session ID:", data[0].id);
    console.log("AI Reading JSON:", JSON.stringify(data[0].ai_reading, null, 2));
  } else {
    console.log("No sessions found.");
  }
}

checkLatestReading();
