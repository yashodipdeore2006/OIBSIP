import mongoose from "mongoose";

const globalCache = globalThis.__pizzaDeliveryMongoCache || {
  promise: null,
};

globalThis.__pizzaDeliveryMongoCache = globalCache;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        return connection;
      })
      .catch((error) => {
        globalCache.promise = null;
        throw error;
      });
  }

  return globalCache.promise;
};

export default connectDB;
