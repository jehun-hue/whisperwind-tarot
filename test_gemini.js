
const apiKey = "AIza..."; // I'll use the environment variable in the real call
const models = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro-latest"];

async function test() {
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
      });
      console.log(`Model ${model}: ${resp.status}`);
      if (!resp.ok) console.log(await resp.text());
    } catch (e) {
      console.log(`Model ${model} failed: ${e.message}`);
    }
  }
}
test();
