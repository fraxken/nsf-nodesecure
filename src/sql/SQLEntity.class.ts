// Import Third-party Dependencies
import sqlite from "better-sqlite3";

export interface IColumnParameters {
  type: string;

  /**
   * I
   * 
   * @default false
   */
  pk?: boolean;

  /**
   * @default false
   */
  nullable?: boolean;
}

export interface ISQLEntityOptions {
  /**
   * @default true
   */
  createPrimaryKey?: boolean;
}

export default class SQLEntity<T> {
  private tableName: string;
  private columns = new Map<string, Required<IColumnParameters>>();
  private insertTransaction: sqlite.Transaction | null = null;

  constructor(tableName: string, options: ISQLEntityOptions = {}) {
    const { createPrimaryKey = true } = options;

    this.tableName = tableName;
    if (createPrimaryKey) {
      this.column("id", { type: "INTEGER", pk: true });
    }
  }

  protected column(columnName: string, options: IColumnParameters) {
    const { type, pk = false, nullable = false } = options;

    this.columns.set(columnName, { type, pk, nullable });

    return this;
  }

  #columnToString(columnName: string): string {
    const parameters = this.columns.get(columnName)!;

    const pkPart = parameters.pk ? " PRIMARY KEY" : "";
    const nullablePart = parameters.nullable ? "" : " NOT NULL";

    return `"${columnName}" ${parameters.type}${pkPart}${nullablePart}`;
  }

  initialize(db: sqlite.Database) {
    {
      const columns = [...this.columns.keys()]
        .map((columnName) => this.#columnToString(columnName))
        .join(",\n");

      db.exec(`CREATE TABLE IF NOT EXISTS "${this.tableName}" (\n${columns}\n);`);
    }

    const keys = [...this.columns.keys()].filter((name) => name !== "id");
    const prefixedKeys = keys.map((key) => `@${key}`).join(", ");
    
    const insertOne = db.prepare(
      `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${prefixedKeys})`
    );

    this.insertTransaction = db.transaction((array) => {
      for (const row of array) {
        insertOne.run(row);
      }
    });

    return this;
  }

  insert(data: T | T[]) {
    this.insertTransaction!(
      Array.isArray(data) ? data : [data]
    );

    return this;
  }
}
