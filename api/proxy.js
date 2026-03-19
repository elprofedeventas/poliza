// api/proxy.js — Vercel Serverless Function
// Coloca este archivo en: /api/proxy.js en tu proyecto Vercel
// Variable de entorno requerida: GAS_URL (la URL del Web App de Google Apps Script)

export default async function handler(req, res) {
  // CORS — permitir desde cualquier origen (para demo)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const GAS_URL = process.env.GAS_URL;
  if (!GAS_URL) {
    return res.status(500).json({ ok: false, error: "GAS_URL no configurada en variables de entorno." });
  }

  try {
    let gasResponse;

    if (req.method === "GET") {
      // Pasar query params al GAS
      const params = new URLSearchParams(req.query).toString();
      const url = params ? `${GAS_URL}?${params}` : GAS_URL;
      gasResponse = await fetch(url);

    } else if (req.method === "POST") {
      gasResponse = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

    } else {
      return res.status(405).json({ ok: false, error: "Método no permitido." });
    }

    const data = await gasResponse.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
