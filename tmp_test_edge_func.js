async function run() {
  const url = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
  const payload = {
    sessionId: "test-session-12345",
    question: "This is a test question for deployment check.",
    birthInfo: {
      year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: "male",
      birthDate: "1987-07-17", birthTime: "15:30"
    },
    cards: [
      { name: "The Fool", position: 1 },
      { name: "The Magician", position: 2 },
      { name: "The High Priestess", position: 3 },
      { name: "The Empress", position: 4 },
      { name: "The Emperor", position: 5 }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2).slice(0, 1000)); // Log part of the response
    console.log("Error Message:", data.error_message || "None");
    console.log("Stack Trace:", data.stack_trace || "None");
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

run();
