# ReportSaathi

**Understand your scan report in plain words, privately, on your own device.**

ReportSaathi ("report companion") explains X-ray, CT, MRI and ultrasound reports in simple English or Hindi. It's built with **Firebase AI Logic hybrid inference**: Gemini Nano runs the explanation inside Chrome on the user's own machine, and Gemini in the cloud is used only as an opt-in fallback, after personal details are stripped out.

Built for **#BuildHybridAI 2026** (Web / Chrome platform).

## Why hybrid matters here

Radiology reports are some of the most sensitive documents a person owns: name, patient ID, age, hospital, and findings that may describe a serious illness. Today patients either Google the jargon or paste the whole report into a cloud chatbot.

ReportSaathi makes the private path the default:

| Situation | What happens |
|---|---|
| Chrome with Gemini Nano available | `InferenceMode.ONLY_ON_DEVICE`. The full report, photo included, never leaves the device. |
| On-device model not available, user allowed cloud fallback | Report is run through a client-side PHI scrubber (names, IDs, phone, email, dates, age), then sent with `InferenceMode.PREFER_IN_CLOUD`. |
| On-device not available, cloud fallback off | Nothing is sent. The user is told why. |
| Photo of a report, no on-device model | Refused, because names printed on a photo can't be removed before upload. |

The UI always shows where inference happened (using `response.inferenceSource`) and what was redacted.

## Features

- Paste report text, or add a **photo** of a printed report (multimodal Gemini Nano reads it on-device).
- Output in four fixed sections: *In one line*, *What the scan looked at*, *Key findings in plain words*, *Questions to ask your doctor*.
- **English or Hindi** output, for patients across India.
- Streaming responses.
- Urgent-wording detection in the prompt ("show this to your doctor today").
- No diagnosis, no treatment advice, clear disclaimer.

## Firebase products used

- **Firebase AI Logic** (Web SDK, `firebase/ai`): `getGenerativeModel` with `HybridParams`, `initializeDeviceModel`, `generateContent` (image), `generateContentStream` (text), `inferenceSource`. See [`src/firebase.js`](src/firebase.js) and [`src/main.js`](src/main.js).
- **App Check** with reCAPTCHA Enterprise (debug token on localhost).
- **Remote Config**: cloud model name and reading level can be tuned without a redeploy.
- **Firebase Hosting**.

## Run it

Requirements: Node 20+, Chrome 139+ on desktop, with `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` set to **Enabled**.

```bash
npm install
cp .env.example .env   # fill in your Firebase web app config + reCAPTCHA Enterprise key
npm run dev
```

1. In the Firebase console: enable **Firebase AI Logic** (Gemini Developer API), register a Web app, and set up **App Check** with reCAPTCHA Enterprise.
2. On localhost, copy the App Check debug token from the browser console and add it under *App Check → Apps → Manage debug tokens*.
3. Click **Try a sample report** (a fictional report), then **Explain my report**. The first run downloads Gemini Nano.

Deploy:

```bash
npm run build
firebase deploy --only hosting
```

## Project structure

```
src/firebase.js   Firebase init, App Check, Remote Config, hybrid model factory
src/main.js       UI flow: availability check, mode choice, PHI scrub, streaming
src/phi.js        Client-side PHI scrubber (runs before any cloud call)
src/prompt.js     Patient-friendly prompt + photo transcription prompt
src/sample.js     Fictional demo report
```

## Limits

- The PHI scrubber is rule-based and best-effort, not a certified de-identification tool. That's why on-device is the default and cloud fallback is opt-in.
- ReportSaathi explains words; it is not medical advice.

## License

Apache 2.0
