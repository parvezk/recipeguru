import { config } from "dotenv";
config({ path: ".env.local" });

import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";
import { Pool } from "pg";

async function testConnection() {
  console.log("🔐 Creating RDS signer...");
  console.log(`   Host: ${process.env.PGHOST}`);
  console.log(`   User: ${process.env.PGUSER}`);
  console.log(`   Region: ${process.env.AWS_REGION}`);

  const signer = new Signer({
    hostname: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    username: process.env.PGUSER,
    region: process.env.AWS_REGION,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN,
      clientConfig: { region: process.env.AWS_REGION },
    }),
  });

  console.log("\\n🔑 Generating auth token...");
  const token = await signer.getAuthToken();
  console.log(`   Token generated (length: ${token.length})`);

  console.log("\\n🔌 Connecting to database...");
  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE || "postgres",
    password: token,
    port: Number(process.env.PGPORT),
    ssl: { rejectUnauthorized: false },
  });

  const result = await pool.query("SELECT NOW() as time, current_database() as db");
  console.log(`\\n✅ Connected successfully!`);
  console.log(`   Database: ${result.rows[0].db}`);
  console.log(`   Server time: ${result.rows[0].time}`);

  await pool.end();
}

testConnection().catch((err) => {
  console.error("\\n❌ Connection failed:", err.message);
  process.exit(1);
});
