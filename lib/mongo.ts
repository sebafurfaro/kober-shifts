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

const MONGO_RETRY_ATTEMPTS = 3;
const MONGO_RETRY_DELAY_MS = 1500;

function connect(): Promise<MongoClient> {
  const client = new MongoClient(uri!);

  async function attempt(n: number): Promise<MongoClient> {
    try {
      await client.connect();
      globalForMongo.mongoClient = client;
      return client;
    } catch (err) {
      globalForMongo.mongoClientPromise = undefined;
      if (n < MONGO_RETRY_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, MONGO_RETRY_DELAY_MS));
        return attempt(n + 1);
      }
      throw err;
    }
  }

  return attempt(1);
}

export function getMongoClientPromise(): Promise<MongoClient> {
  if (globalForMongo.mongoClientPromise) return globalForMongo.mongoClientPromise;
  globalForMongo.mongoClientPromise = connect();
  return globalForMongo.mongoClientPromise;
}

export const mongoClientPromise: Promise<MongoClient> = getMongoClientPromise();


