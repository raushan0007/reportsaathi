import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
} from "firebase/ai";
import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
} from "firebase/remote-config";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// App Check is required by Firebase AI Logic. On localhost we use a debug
// token (printed in the console; register it in Firebase console).
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
}
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY
  ),
  isTokenAutoRefreshEnabled: true,
});

// Remote Config lets us tune the cloud model and prompt style without a redeploy.
const rc = getRemoteConfig(app);
rc.settings.minimumFetchIntervalMillis = 60 * 60 * 1000;
rc.defaultConfig = {
  cloud_model: "gemini-3.8-flash",
  reading_level: "a 12-year-old",
};
export async function loadRemoteConfig() {
  try {
    await fetchAndActivate(rc);
  } catch (e) {
    console.warn("[ReportSaathi] Remote Config fetch failed, using defaults", e);
  }
  return {
    cloudModel: getValue(rc, "cloud_model").asString(),
    readingLevel: getValue(rc, "reading_level").asString(),
  };
}

const ai = getAI(app, { backend: new GoogleAIBackend() });

export const MODES = {
  PREFER_ON_DEVICE: InferenceMode.PREFER_ON_DEVICE,
  ONLY_ON_DEVICE: InferenceMode.ONLY_ON_DEVICE,
  PREFER_IN_CLOUD: InferenceMode.PREFER_IN_CLOUD,
};

export function makeModel(mode, cloudModel) {
  return getGenerativeModel(ai, {
    mode,
    inCloudParams: {
      model: cloudModel,
      generationConfig: { temperature: 0.3 },
    },
    onDeviceParams: {
      createOptions: { temperature: 0.3, topK: 3 },
    },
  });
}
