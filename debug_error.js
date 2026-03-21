
const fetch = globalThis.fetch;

async function check_error() {
  const res = await fetch("https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTY2MDAsImV4cCI6MjA1OTA5MjYwMH0.5F2OyEBBvXY3k7v3LBbFMXcfQLOSOSmJCEMbHxbeKEA"
    },
    body: JSON.stringify({
      mode: "full",
      birthInfo: { birthDate: "1987-07-17", birthTime: "15:30", gender: "male" },
      question: "debug error"
    })
  });

  const data = await res.json();
  console.log("=== API Error Check ===");
  console.log("Status:", data.status);
  console.log("Error Message:", data.error_message);
  console.log("Stack:", data.stack_trace?.slice(0, 500));
}

check_error().catch(console.error);
