import mongoose from "mongoose";
import dns from "dns";

// CRITICAL: Fix DNS resolution BEFORE any async operations
dns.setServers(["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]);
console.log("✓ DNS servers configured:", dns.getServers());

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define mongo_uri in env variables");
}

let cached = global.mongoose; //get the mongoose var from global object, defined in type.d.ts
console.log("cached mongoose:", cached);
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      serverApi: {
        version: "1" as const,
        strict: true,
        deprecationErrors: true,
      },
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("Database connection failed:", error);
    throw error;
  }

  return cached.conn;
}
