import { spawnSync } from "node:child_process";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";

async function generateToken() {
  const host = process.env.PGHOST;
  const port = Number(process.env.PGPORT || 5432);
  const user = process.env.PGUSER;
  const database = process.env.PGDATABASE || "postgres";
  const region = process.env.AWS_REGION;
  const roleArn = process.env.AWS_ROLE_ARN;

  if (!host || !user || !region || !roleArn) {
    throw new Error(
      "Missing required env vars in .env.local (PGHOST, PGUSER, AWS_REGION, AWS_ROLE_ARN)",
    );
  }

  const signer = new Signer({
    hostname: host,
    port,
    username: user,
    region,
    credentials: awsCredentialsProvider({
      roleArn,
      clientConfig: { region },
    }),
  });

  const token = await signer.getAuthToken();

  if (process.argv.includes("--raw")) {
    process.stdout.write(token);
    return;
  }

  const copied =
    process.platform === "darwin" &&
    spawnSync("pbcopy", { input: token, encoding: "utf8" }).status === 0;

  console.log("\n✅ Generated AWS RDS IAM auth token (valid for 15 minutes)");
  if (copied) {
    console.log("📋 Token has been copied to your macOS clipboard!\n");
  }
  console.log("Use these settings in pgAdmin 4 / Postico 2 / TablePlus:");
  console.log("────────────────────────────────────────────────────────");
  console.log(`  Host name/address : ${host}`);
  console.log(`  Port              : ${port}`);
  console.log(`  Maintenance DB    : ${database}`);
  console.log(`  Username          : ${user}`);
  console.log(`  SSL mode          : Require`);
  console.log(
    `  Password          : ${copied ? "<Cmd+V to paste from clipboard>" : token}`,
  );
  console.log("────────────────────────────────────────────────────────\n");
}

generateToken().catch((err) => {
  console.error("❌ Failed to generate RDS auth token:", err.message);
  process.exit(1);
});
