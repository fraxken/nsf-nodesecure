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
  unpkg: string | null;
}

export class Warning extends SQLEntity<WarningEntity> {
  static convertSastWarning(warning: any, packageName: string): WarningEntity {
    const file = warning?.file ?? null;

    return {
      package: packageName,
      kind: warning.kind,
      location: utils.locationToString(
        warning.kind === "encoded-literal" ? warning.location[0] : warning.location
      ),
      value: warning?.value ?? null,
      severity: warning.severity ?? "Information",
      file,
      unpkg: file === null ? null : getUnpkgURL(file, packageName)
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
    this.column("unpkg", {
      type: "VARCHAR(500)",
      nullable: true
    });
  }
}

function getUnpkgURL(fileName: string, packageName: string): null | string {
  if (fileName === "../" || fileName === "./") {
    return null;
  }
  const cleanedFile = fileName.startsWith("./") ? fileName.slice(2) : fileName;

  return `https://unpkg.com/${packageName}/${cleanedFile}`;
}
