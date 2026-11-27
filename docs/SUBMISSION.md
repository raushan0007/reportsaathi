# Devpost submission: ReportSaathi

## Project name
ReportSaathi

## Elevator pitch (tagline, ≤200 chars)
Understand your X-ray, CT or MRI report in plain English or Hindi, privately. Gemini Nano explains it on your device; the cloud is opt-in and only sees de-identified text.

## Platform
Web (Chrome)

## Story

### Inspiration
I work in healthcare imaging IT, running PACS and teleradiology systems for government hospitals in India. Every day patients walk out with a radiology report full of words like "ground glass opacity" or "bronchiectatic changes", and the doctor has five minutes for them. So they Google it, or they paste the whole report, with their name, patient ID and age, into a cloud chatbot.

A radiology report is one of the most private documents a person owns. I wanted the easy path and the private path to be the same path.

### What it does
- Paste a report, or take a photo of a printed one.
- ReportSaathi explains it in four fixed sections: *In one line*, *What the scan looked at*, *Key findings in plain words*, and *Questions to ask your doctor*.
- Output in simple English or Hindi.
- It never diagnoses or suggests treatment, and it flags urgent wording ("show this to your doctor today").
- A badge shows where the AI actually ran (on-device or cloud), plus what was redacted.

### How we built it, and why hybrid
Built with the **Firebase AI Logic Web SDK** and its hybrid inference:

- If Chrome can run **Gemini Nano**, we use `InferenceMode.ONLY_ON_DEVICE`. The full report, photo included, never leaves the laptop. `initializeDeviceModel()` handles the first-run download with a progress bar.
- If Gemini Nano isn't available, the user can opt in to cloud fallback. The text first goes through a client-side PHI scrubber (names, patient IDs, Aadhaar-like numbers, phone numbers, emails, dates, age), then it's sent with `InferenceMode.PREFER_IN_CLOUD` to Gemini in the cloud.
- Photos are only processed on-device, because names printed on an image can't be removed before upload.
- Responses stream with `generateContentStream`, and `response.inferenceSource` drives the on-device/cloud badge.
- **App Check** (reCAPTCHA Enterprise) protects the AI endpoints. **Remote Config** controls the cloud model and target reading level without a redeploy. **Firebase Hosting** serves the app.

### Challenges
- Deciding the privacy policy *per input*, not per app: text can fall back to the cloud after scrubbing, while images cannot.
- Writing a prompt small enough for Gemini Nano that still produces consistent, structured, non-alarming explanations in two languages.

### Accomplishments
- The default path sends zero bytes of the report off the device.
- Works for Hindi-speaking patients, not just English readers.

### What we learned
Hybrid inference isn't only about cost or offline use. In healthcare it's a privacy architecture: on-device by default, cloud as a consented, de-identified fallback.

### What's next
- Android version with Gemini Nano via Firebase AI Logic.
- More Indian languages.
- QR code on printed reports at hospital counters, so patients open ReportSaathi straight from the paper.

## Built with
firebase-ai-logic, gemini-nano, gemini, firebase-app-check, firebase-remote-config, firebase-hosting, javascript, vite, chrome-prompt-api

## Links
- Code: https://github.com/raushan0007/reportsaathi
- Live demo: (Firebase Hosting URL after deploy)
- Video: (YouTube URL)

---

# Demo video script (target 2:30, English)

**0:00–0:20 · Problem** (screen: a printed report, or the sample report text)
"This is a real-world style CT report. Patients get these every day and don't understand them. Most paste them into a cloud chatbot, along with their name and patient ID. ReportSaathi fixes that."

**0:20–0:35 · Device check** (screen: app open, green pill "Gemini Nano is ready on this device")
"ReportSaathi uses Firebase AI Logic hybrid inference. Here it has detected Gemini Nano running locally in Chrome."

**0:35–1:15 · On-device run** (click *Try a sample report* → *Explain my report*. Optional: turn Wi-Fi off first to prove it's local.)
"I'll explain this report. Notice the badge: Ran on-device, Gemini Nano. And: Your report never left this device. I can even switch off the internet and it still works."
Scroll through the four sections.

**1:15–1:35 · Hindi** (switch language to Hindi, run again)
"Most patients in India are more comfortable in Hindi, so the same explanation works in Hindi."

**1:35–1:55 · Photo** (upload a photo of a printed sample report)
"Patients usually have paper, not text. Gemini Nano reads the photo locally too. Photos are never sent to the cloud."

**1:55–2:20 · Cloud fallback** (open in a browser/profile without Gemini Nano, tick "Allow cloud fallback", run)
"On a device without Gemini Nano, the user can opt in to the cloud. Before anything is sent, names, IDs, phone numbers and dates are removed on the device. The badge now says: Ran in cloud, and shows what was redacted."

**2:20–2:30 · Close**
"ReportSaathi: private by default, cloud only by consent. Built with Firebase AI Logic, App Check and Remote Config."
