import crypto from "crypto";

const ENCRYPTED_PREFIX = "enc:v1:";

let warnedMissingKey = false;
let cachedKey = undefined;

const getKey = () => {
  if (cachedKey !== undefined) return cachedKey;

  const raw = process.env.PII_ENCRYPTION_KEY;
  if (!raw) {
    cachedKey = null;
    return cachedKey;
  }

  const tryParse = (encoding) => {
    try {
      const buf = Buffer.from(raw, encoding);
      return buf.length === 32 ? buf : null;
    } catch {
      return null;
    }
  };

  cachedKey = tryParse("base64") || tryParse("hex");
  if (!cachedKey) {
    throw new Error(
      "PII_ENCRYPTION_KEY must be 32 bytes (base64 or hex encoding)",
    );
  }
  return cachedKey;
};

export const isEncryptedPii = (value) => {
  return typeof value === "string" && value.startsWith(ENCRYPTED_PREFIX);
};

export const maybeEncryptPii = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  if (!value) return value;
  if (isEncryptedPii(value)) return value;

  const key = getKey();
  if (!key) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      // Do not throw in dev by default; keep app functional.
      console.warn(
        "⚠️  PII_ENCRYPTION_KEY not set; storing PII in plaintext.",
      );
    }
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${tag.toString(
    "base64",
  )}:${ciphertext.toString("base64")}`;
};

export const maybeDecryptPii = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  if (!isEncryptedPii(value)) return value;

  const key = getKey();
  if (!key) {
    // If key is missing, we cannot decrypt; return the stored value.
    return value;
  }

  const payload = value.slice(ENCRYPTED_PREFIX.length);
  const [ivB64, tagB64, ctB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !ctB64) return value;

  try {
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const ciphertext = Buffer.from(ctB64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    return value;
  }
};

export const maskPhone = (phone) => {
  if (phone === null || phone === undefined) return phone;
  const str = typeof phone === "string" ? phone : String(phone);
  if (!str) return str;

  // Never attempt to derive digits from ciphertext
  if (isEncryptedPii(str)) return "****";

  const digits = str.replace(/\D/g, "");
  if (digits.length <= 4) return "****";

  const last4 = digits.slice(-4);
  return `****${last4}`;
};
