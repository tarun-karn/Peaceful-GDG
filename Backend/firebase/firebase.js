const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let serviceAccount = {};
try {
  serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, "firebase-admin.json"), "utf8")
  );
} catch (err) {
  // file may not exist or be unreadable; we'll allow env-based credentials as fallback
  serviceAccount = {};
}

// If env vars are present, prefer them (useful for CI / production)
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    private_key_id:
      process.env.FIREBASE_PRIVATE_KEY_ID || serviceAccount.private_key_id,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID || serviceAccount.client_id,
    auth_uri:
      serviceAccount.auth_uri || "https://accounts.google.com/o/oauth2/auth",
    token_uri:
      serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: serviceAccount.auth_provider_x509_cert_url,
    client_x509_cert_url: serviceAccount.client_x509_cert_url,
  };
}

// Ensure private_key has proper newlines when stored with escaped "\\n"
if (
  serviceAccount &&
  serviceAccount.private_key &&
  typeof serviceAccount.private_key === "string"
) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

try {
  // Basic validation for PEM format to provide actionable error messages
  const key =
    serviceAccount && serviceAccount.private_key
      ? serviceAccount.private_key
      : "";
  const looksLikePem =
    key.includes("BEGIN PRIVATE KEY") &&
    key.includes("END PRIVATE KEY") &&
    !key.includes("...");
  if (!serviceAccount || !serviceAccount.private_key || !looksLikePem) {
    console.error(
      "Invalid or missing Firebase private key. Replace 'firebase-admin.json' with a valid service account JSON (ensure the private_key contains full PEM with proper -----BEGIN/END PRIVATE KEY----- blocks), or set the credentials via environment variables."
    );
    throw new Error("Firebase private_key is missing or not a valid PEM.");
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (err) {
  // Provide clearer error message for troubleshooting invalid credentials
  console.error(
    "Failed to initialize Firebase admin:",
    err && err.message ? err.message : err
  );
  throw err;
}

module.exports = admin;
