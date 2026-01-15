import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ??
  (process.env.NODE_ENV !== "production"
    ? "mongodb://root:root@127.0.0.1:27018/kober_shifts?authSource=admin"
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


