import mysql from "./lib/mysql";

async function run() {
  const [rows] = await mysql.execute("SHOW TABLES;");
  console.log(rows);
  process.exit(0);
}
run();
