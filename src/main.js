import "./style.css";
import { makeModel, MODES, loadRemoteConfig } from "./firebase.js";
import { scrubPHI } from "./phi.js";
import { buildPrompt, IMAGE_PROMPT } from "./prompt.js";
import { renderMarkdown } from "./md.js";
import { SAMPLE_REPORT } from "./sample.js";

const $ = (id) => document.getElementById(id);
const els = {
  report: $("report"),
  image: $("image"),
  lang: $("lang"),
  allowCloud: $("allowCloud"),
  explain: $("explain"),
  sample: $("sample"),
  status: $("status"),
  badge: $("badge"),
  privacy: $("privacy"),
  output: $("output"),
  deviceState: $("deviceState"),
};

const FALLBACK_CLOUD_MODEL = "gemini-3.5-flash-lite";
let config = { cloudModel: "gemini-3.8-flash", readingLevel: "a 12-year-old" };
let deviceModelReady = false;

// ---- On-device availability -------------------------------------------------
async function onDeviceAvailability() {
  if (!("LanguageModel" in self)) return "unavailable";
  try {
    return await self.LanguageModel.availability({
      expectedInputs: [{ type: "text" }, { type: "image" }],
    });
  } catch {
    try {
      return await self.LanguageModel.availability();
    } catch {
      return "unavailable";
    }
  }
}

function showDeviceState(state) {
  const map = {
    available: ["✅ Gemini Nano is ready on this device", "ok"],
    downloadable: ["⬇️ Gemini Nano can be downloaded (first run only)", "warn"],
    downloading: ["⬇️ Gemini Nano is downloading…", "warn"],
    unavailable: ["☁️ On-device AI not available in this browser", "cloud"],
  };
  const [text, cls] = map[state] || map.unavailable;
  els.deviceState.textContent = text;
  els.deviceState.className = `pill ${cls}`;
}

// ---- Main flow -------------------------------------------------------------
async function explain() {
  const file = els.image.files[0];
  const raw = els.report.value.trim();
  if (!raw && !file) {
    setStatus("Paste a report or add a photo of one first.");
    return;
  }
  els.explain.disabled = true;
  els.output.innerHTML = "";
  els.badge.hidden = true;
  els.privacy.textContent = "";

  try {
    const avail = await onDeviceAvailability();
    showDeviceState(avail);
    const canUseDevice = avail !== "unavailable";

    if (!canUseDevice && !els.allowCloud.checked) {
      setStatus(
        "This browser can't run Gemini Nano, and cloud fallback is off. Turn on “Allow cloud fallback” to continue (names, IDs, phone numbers and dates are removed first)."
      );
      return;
    }

    // Raw report text never leaves the device: on-device gets it as-is,
    // the cloud only ever gets the scrubbed version.
    const mode = canUseDevice ? MODES.ONLY_ON_DEVICE : MODES.PREFER_IN_CLOUD;
    const model = makeModel(mode, config.cloudModel);

    if (canUseDevice && !deviceModelReady) {
      setStatus("Preparing on-device model…");
      await model.initializeDeviceModel((p) =>
        setStatus(`Downloading Gemini Nano… ${Math.round(p * 100)}%`)
      );
      deviceModelReady = true;
    }

    let reportText = raw;

    if (file) {
      if (!canUseDevice) {
        setStatus(
          "Photos are only read on-device, because names on a photo can't be removed before upload. Please paste the text instead."
        );
        return;
      }
      setStatus("Reading the photo on your device…");
      const imagePart = await fileToPart(file);
      const r = await model.generateContent([IMAGE_PROMPT, imagePart]);
      reportText = [raw, r.response.text()].filter(Boolean).join("\n\n");
    }

    let sent = reportText;
    if (!canUseDevice) {
      const { text, redactions } = scrubPHI(reportText);
      sent = text;
      els.privacy.textContent = `🔒 ${redactions} personal detail(s) removed before sending to the cloud.`;
    } else {
      els.privacy.textContent =
        "🔒 Your report never left this device.";
    }

    setStatus("Explaining…");
    const prompt = buildPrompt(sent, {
      language: els.lang.value,
      readingLevel: config.readingLevel,
    });
    // In the cloud, fall back to a lighter model if the main one is busy.
    const cloudModels = canUseDevice
      ? [null]
      : [...new Set([config.cloudModel, FALLBACK_CLOUD_MODEL])];
    let final, usedModel;
    for (const [i, name] of cloudModels.entries()) {
      try {
        const m = name ? makeModel(mode, name) : model;
        const stream = await m.generateContentStream(prompt);
        let acc = "";
        for await (const chunk of stream.stream) {
          acc += chunk.text();
          els.output.innerHTML = renderMarkdown(acc);
        }
        final = await stream.response;
        usedModel = name;
        break;
      } catch (e) {
        const busy = /\b(429|500|503)\b|high demand|overloaded|unavailable/i.test(String(e.message || e));
        if (!busy || i === cloudModels.length - 1) throw e;
        console.warn(`[ReportSaathi] ${name} busy, trying ${cloudModels[i + 1]}`);
        setStatus("Cloud model busy, retrying with a lighter model…");
      }
    }
    showBadge(final.inferenceSource || (canUseDevice ? "on_device" : "in_cloud"), usedModel);
    els.output.insertAdjacentHTML(
      "beforeend",
      `<p class="disclaimer">ReportSaathi explains words, it is not medical advice. Always discuss your report with your doctor.</p>`
    );
    setStatus("");
  } catch (err) {
    console.error("[ReportSaathi]", err);
    setStatus(`Something went wrong: ${err.message || err}`);
  } finally {
    els.explain.disabled = false;
  }
}

function showBadge(source, usedModel) {
  els.badge.hidden = false;
  if (source === "on_device") {
    els.badge.textContent = "⚡ Ran on-device · Gemini Nano";
    els.badge.className = "badge device";
  } else {
    els.badge.textContent = `☁️ Ran in cloud · ${usedModel || config.cloudModel}`;
    els.badge.className = "badge cloud";
  }
}

function setStatus(t) {
  els.status.textContent = t;
}

async function fileToPart(file) {
  const b64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  return { inlineData: { data: b64, mimeType: file.type || "image/jpeg" } };
}

// ---- Wire up ----------------------------------------------------------------
els.explain.addEventListener("click", explain);
els.sample.addEventListener("click", () => {
  els.report.value = SAMPLE_REPORT;
});
onDeviceAvailability().then(showDeviceState);
loadRemoteConfig().then((c) => (config = c));
