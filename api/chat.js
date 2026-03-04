export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { system, userMsg } = req.body;
  if (!system || !userMsg) return res.status(400).json({ error: "Missing fields" });

  const apiKey = process.env.GEMINI.API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not set on server" });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: system + "\n\n" + userMsg }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    try { return res.status(200).json(JSON.parse(clean)); }
    catch { return res.status(200).json({ _raw: text }); }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


