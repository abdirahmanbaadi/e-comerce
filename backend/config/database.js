const dns = require('dns');
const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

// Many Somali/ISP Wi‑Fi networks break MongoDB SRV (querySrv ETIMEOUT).
// Force public DNS for Node lookups before connecting to Atlas.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // ignore if platform blocks setServers
}

function isDnsError(error) {
  const message = String(error?.message || error?.code || '');
  return /queryTxt|querySrv|ENOTFOUND|EREFUSED|ETIMEOUT|ESERVFAIL|getaddrinfo/i.test(message);
}

function logDnsHelp() {
  console.error('\nMongoDB DNS lookup failed. This is common on some Wi‑Fi/mobile networks.');
  console.error('Try one of these fixes, then run `npm run dev` again:');
  console.error('  1. Change Windows DNS to 8.8.8.8 and 1.1.1.1 (Network settings)');
  console.error('  2. Turn VPN off, or switch to another network/hotspot');
  console.error('  3. In MongoDB Atlas → Network Access → allow your current IP (or Anywhere for student project)');
  console.error('  4. Atlas → Connect → Drivers → copy a fresh connection string into backend/.env\n');
}

function attachConnectionListeners() {
  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.removeAllListeners('reconnected');
  mongoose.connection.removeAllListeners('error');

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected — driver will try to reconnect.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });
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
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        family: 4,
      });

      attachConnectionListeners();
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
