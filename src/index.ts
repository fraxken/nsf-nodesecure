// Import Node.js Dependencies
import { readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import sqlite from "better-sqlite3";
import * as scanner from "@nodesecure/scanner";
import * as utils from "@nodesecure/utils";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const kRootLocation = path.join(__dirname, "..");
console.log(kRootLocation);

interface IRunOptions {
  name: string;
  location: string;
  root: string;
}

type Context = {
  outdir: string;
  count: number;
  db: sqlite.Database;
  insertManyWarnings: sqlite.Transaction;
};

export async function init(): Promise<Context> {
  const outdir = path.join(process.cwd(), "nsf-results");
  await fs.mkdir(outdir, { recursive: true });

  const db = sqlite(path.join(outdir, "data.db"));
  db.exec(
    readFileSync(path.join(kRootLocation, "initDatabase.sql"), "utf-8")
  );

  const insertWarnings = db.prepare(`INSERT INTO warnings (package, kind, location, value, severity, file)
  VALUES (@package, @kind, @location, @value, @severity, @file)`);

  const insertManyWarnings = db.transaction((warnings) => {
    for (const warn of warnings) insertWarnings.run(warn);
  });

  return { outdir, count: 0, db, insertManyWarnings };
}

export async function close() {
  console.log("close triggered");
}

export async function run(ctx: Context, options: IRunOptions) {
  const { name, location } = options;

  console.log(`[${ctx.count++}] start processing '${name}'`);
  try {
    const result = await scanner.tarball.scanPackage(location, name);

    ctx.insertManyWarnings(
      result.ast.warnings.map((warn: any) => transformSastWarning(warn, name))
    );
  }
  catch(err) {
    console.error(`Failed package '${name}'`);
    console.error(err);
  }
}

function transformSastWarning(warning: any, name: string) {
  return {
    package: name,
    kind: warning.kind,
    location: utils.locationToString(
      warning.kind === "encoded-literal" ? warning.location[0] : warning.location
    ),
    value: warning?.value ?? null,
    severity: warning.severity ?? "Information",
    file: warning?.file ?? null
  };
}
