import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";
import Participant from "../models/Participant.js";
import ParticipantAuth from "../models/ParticipantAuth.js";
import SpeakerAuth from "../models/SpeakerAuth.js";

import { maybeEncryptPii } from "../utils/piiCrypto.js";

dotenv.config();

const PREFIX = "enc:v1:";
const isEncrypted = (value) => typeof value === "string" && value.startsWith(PREFIX);

const migrateModel = async (name, Model) => {
  let scanned = 0;
  let updated = 0;

  const cursor = Model.find({ phone: { $type: "string", $ne: "" } })
    .select("phone")
    .cursor();

  for await (const doc of cursor) {
    scanned += 1;

    const phone = doc.phone;
    if (typeof phone !== "string" || !phone.trim()) continue;
    if (isEncrypted(phone)) continue;

    doc.phone = maybeEncryptPii(phone);
    await doc.save({ validateBeforeSave: false });
    updated += 1;
  }

  console.log(`✅ ${name}: scanned=${scanned}, encrypted=${updated}`);
};

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not set");
    process.exit(1);
  }

  if (!process.env.PII_ENCRYPTION_KEY) {
    console.error(
      "❌ PII_ENCRYPTION_KEY is not set. Set it before migrating so phones are actually encrypted."
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  await migrateModel("User", User);
  await migrateModel("Participant", Participant);
  await migrateModel("ParticipantAuth", ParticipantAuth);
  await migrateModel("SpeakerAuth", SpeakerAuth);

  await mongoose.disconnect();
  console.log("✅ Done");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
