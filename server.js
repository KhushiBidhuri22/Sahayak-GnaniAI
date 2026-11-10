
const http = require("http");
const fs = require("fs");
const path = require("path");
const gnani = require("./gnani");

// tiny .env loader
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const venue = JSON.parse(fs.readFileSync(path.join(__dirname, "venue.json"), "utf8"));
const PORT = process.env.PORT || 3000;

// ---- routing: BFS over edges (reverse edges auto-added) ----
function route(from, to) {
  if (!venue.nodes[from] || !venue.nodes[to]) return null;
  const adj = {};
  for (const e of venue.edges) {
    (adj[e.from] ||= []).push({ to: e.to, en: e.en, hi: e.hi });
    (adj[e.to] ||= []).push({ to: e.from, en: "Turn around and go back toward " + venue.nodes[e.from].label + ".", hi: "Peeche mudiye aur " + venue.nodes[e.from].label + " ki taraf jaiye." });
  }
  const prev = { [from]: null }, q = [from];
  while (q.length) {
    const n = q.shift();
    if (n === to) break;
    for (const e of adj[n] || []) if (!(e.to in prev)) { prev[e.to] = { n, e }; q.push(e.to); }
  }
  if (!(to in prev)) return null;
  const steps = [];
  for (let c = to; prev[c]; c = prev[c].n) steps.unshift({ from: prev[c].n, to: c, en: prev[c].e.en, hi: prev[c].e.hi });
  return steps;
}


function parseDestination(text) {
  const t = (text || "").toLowerCase();
  for (const [id, words] of Object.entries(venue.destinations))
    if (words.some(w => /^[\x00-\x7F]+$/.test(w)
        ? new RegExp("(^|[^a-z0-9])" + w.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "($|[^a-z0-9])").test(t)  // whole words only (so "ent" won't match "department")
        : t.includes(w))) return id;
  return null;
}

const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise(r => { const b = []; req.on("data", c => b.push(c)); req.on("end", () => r(Buffer.concat(b))); });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/api/venue") return json(res, 200, { venue, gnani: gnani.status() });

    if (url.pathname === "/api/parse" && req.method === "POST") {
      const { text } = JSON.parse((await readBody(req)).toString() || "{}");
      return json(res, 200, { destination: parseDestination(text) });
    }
    if (url.pathname === "/api/route" && req.method === "POST") {
      const { from, to } = JSON.parse((await readBody(req)).toString() || "{}");
      const steps = route(from, to);
      return steps ? json(res, 200, { steps }) : json(res, 404, { error: "no_route" });
    }
    if (url.pathname === "/api/stt" && req.method === "POST") {      // raw audio body
      try { return json(res, 200, { text: await gnani.transcribe(await readBody(req), url.searchParams.get("lang") || "hi") }); }
      catch (e) { return json(res, e.code === "not_configured" ? 501 : 502, { error: e.message }); }
    }
    if (url.pathname === "/api/tts" && req.method === "POST") {
      const { text, lang } = JSON.parse((await readBody(req)).toString() || "{}");
      try { const a = await gnani.synthesize(text, lang || "hi"); res.writeHead(200, { "Content-Type": a.contentType }); return res.end(a.buffer); }
      catch (e) { return json(res, e.code === "not_configured" ? 501 : 502, { error: e.message }); }
    }
    if (url.pathname === "/api/reception-script") {     // text for "reception desk mode"
      const s = venue.receptionScript;
      const dest = url.searchParams.get("dest");
      const label = (venue.nodes[dest] || {}).label || dest;
      return json(res, 200, { disclosure: s.disclosure, question: s.question.replace("{dest}", label), mockReply: s.mockReply });
    }

  
    let p = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = path.join(__dirname, "public", path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
    if (!file.startsWith(path.join(__dirname, "public")) || !fs.existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) { json(res, 500, { error: e.message }); }
}).listen(PORT, () => console.log(`Sahayak running at http://localhost:${PORT}  | Gnani:`, gnani.status()));
