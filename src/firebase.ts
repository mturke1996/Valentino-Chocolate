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
    console.error("   1. Go to: Site settings → Environment variables");
    console.error("   2. Click: Add variable");
    console.error("   3. Add all required variables:");
    missingVars.forEach((key) => console.error(`      - ${key}`));
    console.error("   4. After adding, trigger a new deploy");
    console.error("   📖 See NETLIFY_SETUP.md for detailed instructions");
    
    // Show error in UI
    if (typeof window !== "undefined") {
      const errorDiv = document.createElement("div");
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f44336;
        color: white;
        padding: 16px;
        text-align: center;
        z-index: 99999;
        font-family: Cairo, sans-serif;
        direction: rtl;
      `;
      errorDiv.innerHTML = `
        <strong>⚠️ خطأ في إعدادات Firebase</strong><br>
        يرجى إضافة متغيرات البيئة في Netlify Dashboard<br>
        راجع ملف NETLIFY_SETUP.md للتعليمات التفصيلية
      `;
      document.body.prepend(errorDiv);
    }
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
    // In production, try to initialize anyway but log the error
    console.error(
      "❌ Firebase initialization failed in production mode."
    );
    console.error(
      "⚠️ The app will continue to load, but Firebase features will not work."
    );
    console.error(
      "📝 Please add environment variables in Netlify and redeploy."
    );
    
    // Try to initialize with dummy config to prevent app crash
    try {
      app = initializeApp(firebaseConfig);
      console.warn("⚠️ Firebase initialized with invalid config - features may not work");
    } catch (initError) {
      console.error("❌ Failed to initialize Firebase even with dummy config:", initError);
      // Create a minimal app to prevent complete failure
      app = initializeApp({
        apiKey: "demo-key",
        authDomain: "demo.firebaseapp.com",
        projectId: "demo-project",
        storageBucket: "demo-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:demo",
      });
    }
  }
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
