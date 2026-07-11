const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

function isDnsError(error) {
  const message = String(error?.message || error?.code || '');
  return /queryTxt|ENOTFOUND|EREFUSED|ETIMEOUT|ESERVFAIL|getaddrinfo/i.test(message);
}

function logDnsHelp() {
  console.error('\nMongoDB DNS lookup failed. This is common on some Wi‑Fi/mobile networks.');
  console.error('Try one of these fixes, then run `npm run dev` again:');
  console.error('  1. Change DNS to 8.8.8.8 or 1.1.1.1 (Windows → Network → DNS)');
  console.error('  2. Turn VPN off, or switch to another network/hotspot');
  console.error('  3. In MongoDB Atlas → Network Access → allow your current IP');
  console.error('  4. Atlas → Connect → Drivers → copy a fresh connection string into backend/.env\n');
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined. Copy backend/.env.example to backend/.env and set your Atlas connection string.'
    );
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        family: 4,
      });
      console.log('MongoDB Atlas Connected successfully.');
      return;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (isDnsError(lastError)) {
    logDnsHelp();
  }

  throw lastError;
};

module.exports = connectDB;
