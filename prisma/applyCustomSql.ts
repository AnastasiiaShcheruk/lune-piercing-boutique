import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  const client = new Client({ connectionString });
  const sql = readFileSync(join(process.cwd(), "prisma", "custom.sql"), "utf8");

  await client.connect();
  await client.query(sql);
  await client.end();
}

main()
  .then(() => {
    console.log("Custom SQL applied");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });