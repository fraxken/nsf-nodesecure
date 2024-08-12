// Import Node.js Dependencies
import * as fs from "node:fs";
import * as path from "node:path";

// Import Third-party Dependencies
import sqlite from "better-sqlite3";
import kleur from "kleur";
import ms from "ms";

import { Spinner } from "@topcli/spinner";
import * as scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import { Warning } from "./entities/warnings.js";

// TODO: remove when nsf is published
interface IRunOptions {
  name: string;
  location: string;
  root: string;
}

type Context = {
  packageId: number;
  warning: Warning;
};

export async function init(): Promise<Context> {
  const outdir = path.join(process.cwd(), "nsf-results");
  fs.mkdirSync(outdir, { recursive: true });

  const db = sqlite(path.join(outdir, "data.db"));
  db.exec("PRAGMA foreign_keys = ON;");

  return {
    packageId: 0,
    warning: new Warning().initialize(db)
  };
}

export async function close() {}

export async function run(ctx: Context, options: IRunOptions) {
  const { name, location } = options;

  const coloredTerminalName = kleur.cyan().bold(name);
  const spin = new Spinner({
    name: "dots"
  });

  spin.start(kleur.white().bold(`scanning package`), {
    withPrefix: `${kleur.yellow().bold(ctx.packageId++)} > ${coloredTerminalName}`
  });
  try {
    const { ast } = await scanner.tarball.scanPackage(location, name);

    ctx.warning.insert(
      ast.warnings.map((warn: any) => Warning.convertSastWarning(warn, name))
    );
    spin.succeed(kleur.white().bold(`finished in ${kleur.magenta().bold(ms(spin.elapsedTime))}`));
  }
  catch(err: any) {
    spin.failed(kleur.red().bold(`failed for reason: ${err.toString()}`));
  }
}
