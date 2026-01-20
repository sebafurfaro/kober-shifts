import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ??
  (process.env.NODE_ENV !== "production"
    ? "mongodb://127.0.0.1:27020/kober_shifts"
    : undefined);
if (!uri) throw new Error("Missing MONGODB_URI");

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
  mongoClientPromise?: Promise<MongoClient>;
};

export const mongoClientPromise: Promise<MongoClient> =
  globalForMongo.mongoClientPromise ??
  (async () => {
    const client = new MongoClient(uri);
    await client.connect();
    globalForMongo.mongoClient = client;
    return client;
  })();

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = mongoClientPromise;
}


