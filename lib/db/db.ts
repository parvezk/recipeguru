import { config } from "dotenv";
//The dotenv import ensures environment variables are loaded when running scripts locally - for auth token creation.
config({ path: ".env.local" });

import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { attachDatabasePool } from "@vercel/functions";
import { Signer } from "@aws-sdk/rds-signer";
import { ClientBase, Pool } from "pg";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const pgHost = requireEnv("PGHOST");
const pgPort = Number(requireEnv("PGPORT"));
const pgUser = requireEnv("PGUSER");
const awsRegion = requireEnv("AWS_REGION");
const awsRoleArn = requireEnv("AWS_ROLE_ARN");

const signer = new Signer({
  hostname: pgHost,
  port: pgPort,
  username: pgUser,
  region: awsRegion,
  credentials: awsCredentialsProvider({
    roleArn: awsRoleArn,
    clientConfig: { region: awsRegion },
  }),
});

const pool = new Pool({
  host: pgHost,
  user: pgUser,
  database: process.env.PGDATABASE || "postgres",
  // The auth token value can be cached for up to 15 minutes (900 seconds) if desired.
  password: () => signer.getAuthToken(),
  port: pgPort,
  // Recommended to switch to `true` in production.
  // See <https://docs.aws.amazon.com/lambda/latest/dg/services-rds.html#rds-lambda-certificates>
  ssl: { rejectUnauthorized: false },
  max: 20,
});

//attachDatabasePool utility optimizes connection management in serverless environments.
attachDatabasePool(pool);

// Single query transaction.
export async function query(sql: string, args: unknown[]) {
  return pool.query(sql, args);
}

// Use it for multiple queries transaction.
export async function withConnection<T>(fn: (client: ClientBase) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
