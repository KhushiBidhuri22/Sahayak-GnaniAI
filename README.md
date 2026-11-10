# Sahayak: voice-first errand companion (Gnani hackathon prototype)

Software-first prototype: web dashboard + simulated wearable + QR-checkpoint positioning + route
planning + "reception desk" help mode. Zero npm dependencies (Node 18+).

Gnani models used:
- **Prisma** (speech to text): understands the user's destination and the receptionist's reply.
- **Timbre** (text to speech): speaks directions, the AI disclosure, and the question to reception.

## Run (demo mode, no key needed)

```bash
cd sahayak
node server.js        # open http://localhost:3000 in Chrome or Edge
```

## Turn on real Gnani voice

1. Create a key at https://app.gnani.ai/voice/ (API keys), using your hackathon account.
2. Copy `.env.example` to `.env` and paste it as `GNANI_VOICE_API_KEY`.
3. Restart `node server.js`. The page header should read `Prisma STT on · Timbre TTS on`.

If Timbre rejects the voice name for your model, check the voice catalogue at docs.gnani.ai and set
`GNANI_TTS_VOICE` / `GNANI_TTS_MODEL` in `.env`. Errors show in the page's Event log.

## Demo script

1. Press the big button, say "Mujhe ophthalmology department jaana hai", press again to stop.
2. Click map checkpoints to simulate QR scans: Main Entrance, then Reception.
3. At Reception Sahayak asks permission to ask reception. Say "haan" (or click Yes).
4. Reception desk mode: Sahayak says aloud that it is an AI and asks for directions (Timbre).
   A teammate plays the receptionist and answers out loud. Press "Reception finished" (or wait 20 s).
   Prisma transcribes the reply and Sahayak reads it back.
5. Keep clicking checkpoints: Lift Lobby (F1), Lift Lobby (F2), Corridor Junction, Ophthalmology.
6. Arrival is confirmed. Tick the caregiver box first to see simulated status updates.

Use headphones or keep the laptop speaker volume modest so the mic doesn't re-record Sahayak's voice.

## Customising

Edit `venue.json`: checkpoints (QR ids), edges (spoken directions in `en` and `hi`), destination
keywords, arrival messages, and the reception script.

## Safety and consent

Asks permission before contacting reception; the first thing said is an AI disclosure; caregiver
updates only with consent; never replaces a white cane or human help; no medical advice.

## Production path (not in this prototype)

Real phone calls to reception via a voice agent, real QR/NFC scanning from the wearable camera,
and an LLM to condense the receptionist's reply into short directions.
