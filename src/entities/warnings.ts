// Import Third-party Dependencies
import * as utils from "@nodesecure/utils";

// Import Internal Dependencies
import SQLEntity from "../sql/SQLEntity.class.js";

// TODO: improve type with Scanner & JS-X-Ray types
export interface WarningEntity {
  package: string;
  kind: string;
  location: string;
  value: string | null;
  severity: string;
  file: string | null;
}

export class Warning extends SQLEntity<WarningEntity> {
  static convertSastWarning(warning: any, name: string): WarningEntity {
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
  
  constructor() {
    super("warnings");

    this.column("package", {
      type: "VARCHAR(100)"
    });
    this.column("kind", {
      type: "VARCHAR(50)"
    });
    this.column("location", {
      type: "VARCHAR(100)"
    });
    this.column("value", {
      type: "TEXT",
      nullable: true
    });
    this.column("severity", {
      type: "VARCHAR(50)"
    });
    this.column("file", {
      type: "VARCHAR(500)",
      nullable: true
    });
  }
}
