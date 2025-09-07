import { 
  createClient, 
  type GolemBaseClient,
  type GolemBaseCreate,
  Annotation,
  Tagged
} from "golem-base-sdk";
import { Logger, ILogObj } from "tslog";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const logger = new Logger<ILogObj>({
  name: "Markets DB Init",
  minLevel: 3 // info level
});

async function initMarketsDatabase() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x...";
  console.log("Using PRIVATE_KEY:", PRIVATE_KEY ? "****" + PRIVATE_KEY.slice(-4) : "not set");
  const privateKeyHex = PRIVATE_KEY.replace(/^0x/, "");
  const privateKey = new Uint8Array(
    privateKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  
  const client = await createClient(
    60138453033,
    new Tagged("privatekey", privateKey),
    "https://ethwarsaw.holesky.golemdb.io/rpc",
    "wss://ethwarsaw.holesky.golemdb.io/rpc/ws",
    logger
  );
  
  console.log("Connected to Golem DB!");
  
  // Create markets database/collection entity
  const dbEntity: GolemBaseCreate = {
    data: new TextEncoder().encode(JSON.stringify({
      name: "civic-auth-markets",
      description: "Prediction markets with civic auth gating",
      version: "1.0.0",
      createdAt: Date.now()
    })),
    btl: 86400, // ~2 days (86400 blocks * 2 seconds)
    stringAnnotations: [
      new Annotation("type", "database"),
      new Annotation("name", "civic-auth-markets"),
      new Annotation("purpose", "markets-collection")
    ],
    numericAnnotations: [
      new Annotation("version", 1),
      new Annotation("createdAt", Date.now())
    ]
  };
  
  const createReceipts = await client.createEntities([dbEntity]);
  const databaseKey = createReceipts[0].entityKey;
  
  console.log(`Created markets database with key: ${databaseKey}`);
  console.log(`Add this to your .env file: GOLEM_DB_KEY=${databaseKey}`);
  
  process.exit(0);
}

initMarketsDatabase().catch((error) => {
  console.error("Error initializing database:", error);
  process.exit(1);
});