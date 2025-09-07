import { 
  createClient, 
  type GolemBaseClient,
  type GolemBaseCreate,
  type GolemBaseUpdate,
  Annotation,
  Tagged
} from "golem-base-sdk";
import { Logger, ILogObj } from "tslog";

const logger = new Logger<ILogObj>({
  name: "GolemDB Client",
  minLevel: 3
});

let client: GolemBaseClient | null = null;

export async function getGolemDBClient(): Promise<GolemBaseClient> {
  if (client) return client;
  
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const GOLEM_DB_KEY = process.env.GOLEM_DB_KEY;
  
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }
  
  if (!GOLEM_DB_KEY) {
    throw new Error("GOLEM_DB_KEY environment variable is required. Run the init-db script first.");
  }
  
  const privateKeyHex = PRIVATE_KEY.replace(/^0x/, "");
  const privateKey = new Uint8Array(
    privateKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  
  client = await createClient(
    60138453033,
    new Tagged("privatekey", privateKey),
    "https://ethwarsaw.holesky.golemdb.io/rpc",
    "wss://ethwarsaw.holesky.golemdb.io/rpc/ws",
    logger
  );
  
  return client;
}

export function encodeData(data: any): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data));
}

export function decodeData(data: Uint8Array): any {
  return JSON.parse(new TextDecoder().decode(data));
}

export function createStringAnnotations(annotations: Record<string, string>): Annotation[] {
  return Object.entries(annotations).map(([key, value]) => new Annotation(key, value));
}

export function createNumericAnnotations(annotations: Record<string, number>): Annotation[] {
  return Object.entries(annotations).map(([key, value]) => new Annotation(key, value));
}