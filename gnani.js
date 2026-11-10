

const cfg = () => ({
  key: process.env.GNANI_VOICE_API_KEY || "",
  voice: process.env.GNANI_TTS_VOICE || "Nalini",
  ttsModel: process.env.GNANI_TTS_MODEL || "timbre-v2.5",
  sttModel: process.env.GNANI_STT_MODEL || "prisma-v3.0"
});

const VOICE = "https://api.vachana.ai";
const notConfigured = () => { const e = new Error("not_configured: GNANI_VOICE_API_KEY"); e.code = "not_configured"; return e; };


async function transcribe(audio, lang) {
  const c = cfg(); if (!c.key) throw notConfigured();
  const fd = new FormData();
  fd.append("audio_file", new Blob([audio], { type: "audio/wav" }), "speech.wav");
  fd.append("model", c.sttModel);
  fd.append("language_code", lang === "en" ? "en-IN" : "hi-IN,en-IN");   
  fd.append("format", "transcribe");
  const r = await fetch(VOICE + "/stt/v3", { method: "POST", headers: { "X-API-Key-ID": c.key }, body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) throw new Error(`Gnani STT ${r.status}: ${JSON.stringify(j)}`);
  return j.transcript || "";
}


async function synthesize(text, lang) {
  const c = cfg(); if (!c.key) throw notConfigured();
  const r = await fetch(VOICE + "/api/v1/tts/inference", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key-ID": c.key },
    body: JSON.stringify({
      text, model: c.ttsModel, voice: c.voice,
      language: lang === "en" ? "en-IN" : "hi-en",      
      speed: 1.0,
      audio_config: { sample_rate: 24000, num_channels: 1, sample_width: 2, encoding: "linear_pcm", container: "wav" }
    })
  });
  if (!r.ok) throw new Error(`Gnani TTS ${r.status}: ${await r.text()}`);
  return { contentType: r.headers.get("content-type") || "audio/wav", buffer: Buffer.from(await r.arrayBuffer()) };
}

const status = () => ({ stt: !!cfg().key, tts: !!cfg().key });

module.exports = { transcribe, synthesize, status };
