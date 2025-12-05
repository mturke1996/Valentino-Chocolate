import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Validate environment variables
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(
    ([, value]) =>
      !value ||
      value.includes("XXXX") ||
      value.includes("your-") ||
      value === "demo-key" ||
      value === "demo-project"
  )
  .map(([key]) => key);

if (missingVars.length > 0) {
  const isProduction =
    import.meta.env.MODE === "production" || import.meta.env.PROD;
  console.error(
    "❌ Missing or invalid Firebase environment variables:",
    missingVars
  );
  if (isProduction) {
    console.error(
      "⚠️ CRITICAL: Firebase will not work without these variables!"
    );
    console.error("📝 Please add these variables in Netlify Dashboard:");
    console.error("   Site settings → Environment variables → Add variable");
    console.error("   Required variables:");
    missingVars.forEach((key) => console.error(`   - ${key}`));
  } else {
    console.warn(
      "⚠️ Development mode: Using demo values. Firebase will not work properly."
    );
  }
}

// Validate that we have real Firebase config (not demo values)
const hasValidConfig =
  requiredEnvVars.VITE_FIREBASE_API_KEY &&
  requiredEnvVars.VITE_FIREBASE_API_KEY !== "demo-key" &&
  requiredEnvVars.VITE_FIREBASE_PROJECT_ID &&
  requiredEnvVars.VITE_FIREBASE_PROJECT_ID !== "demo-project";

const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain:
    requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId:
    requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID || "1:123456789:web:demo",
};

// Initialize Firebase
let app;
try {
  if (!hasValidConfig) {
    throw new Error(
      "Invalid Firebase configuration: Missing required environment variables"
    );
  }
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized successfully");
} catch (error: any) {
  console.error("❌ Firebase initialization error:", error);
  console.error("❌ Firebase configuration:", {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + "...",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });

  // Only create dummy app in development
  if (import.meta.env.DEV) {
    console.warn("⚠️ Development mode: Creating dummy Firebase app");
    app = initializeApp({
      apiKey: "demo-key",
      authDomain: "demo.firebaseapp.com",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo",
    });
  } else {
    // In production, throw error to prevent silent failures
    throw new Error(
      "Firebase configuration is invalid. Please check environment variables in Netlify."
    );
  }
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
