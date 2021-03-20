const fs = require("fs");
const pathlib = require("path");

let file = "";

class Printer {
  constructor() {
    this.indentation = "";
  }

  indent() {
    this.indentation += "  ";
    return this;
  }
  deindent() {
    this.indentation = this.indentation.substring(
      0,
      this.indentation.length - 2
    );
    return this;
  }
  println(str) {
    if (str == null) {
    } else {
      file += this.indentation + str;
    }
    return this;
  }
  printEach(items) {
    if (items == null) return this;
    for (let item of items) {
      if (item == null) continue;
      this.println(item);
    }
    return this;
  }

  forEach(items, fn) {
    if (items == null) return this;
    for (let item of items) {
      if (item == null) continue;
      fn(item, this);
    }
    return this;
  }

  forEachInRecord(items, fn) {
    if (items == null) return this;
    for (let key of Object.keys(items)) {
      let item = items[key];
      if (item == null) continue;
      fn(key, item, this);
    }
    return this;
  }
}

function isIdentifier(str) {
  return /^[a-z$_][a-z0-9$_]*$/i.test(str);
}

function mangleNameToIdentifier(str) {
  let sb = "$";
  for (let i = 0; i < str.length; ++i) {
    let char = str.charAt(i);
    if (/[a-z0-9_]/i.test(char)) {
      sb += char;
    } else {
      sb += "$" + str.charCodeAt(i) + "$";
    }
  }
  return sb;
}

function toCapitalCase(str) {
  return str
    .replace(/^[a-z]/, (t) => t.toUpperCase())
    .replace(/_[a-zA-Z]/g, (t) => t.substring(1).toUpperCase());
}

function getTypePrefixFromString(str) {
  return isIdentifier(str) ? toCapitalCase(str) : mangleNameToIdentifier(str);
}

function getTypeNameFromString(str) {
  return getTypePrefixFromString(str) + "Node";
}

function getSyntaxKindFromString(str) {
  return getTypePrefixFromString(str);
}

function getTypeExprFromRef(ref, index) {
  if (ref.isError) {
    return "ErrorNode";
  }
  if (!ref.named) {
    let name = index.typeNames.get(ref.type);
    let arg = name != null ? `SyntaxType.${name}` : JSON.stringify(ref.type);
    return `UnnamedNode<${arg}>`;
  }
  return getTypeNameFromString(ref.type);
}

function buildIndex(json) {
  let typeNames = new Map();
  for (let entry of json) {
    if (entry.named) {
      let name = getSyntaxKindFromString(entry.type);
      typeNames.set(entry.type, name);
    }
  }
  return { typeNames };
}

function generatePreamble(json, printer) {
  printer.println(`
interface NamedNodeBase extends SyntaxNodeBase {
    isNamed: true;
}

/** An unnamed node with the given type string. */
export interface UnnamedNode<T extends string = string> extends SyntaxNodeBase {
  type: T;
  isNamed: false;
}

type PickNamedType<Node, T extends string> = Node extends { type: T; isNamed: true } ? Node : never;

type PickType<Node, T extends string> = Node extends { type: T } ? Node : never;

/** A named node with the given \`type\` string. */
export type NamedNode<T extends SyntaxType = SyntaxType> = PickNamedType<SyntaxNode, T>;

/**
 * A node with the given \`type\` string.
 *
 * Note that this matches both named and unnamed nodes. Use \`NamedNode<T>\` to pick only named nodes.
 */
export type NodeOfType<T extends string> = PickType<SyntaxNode, T>;

interface TreeCursorOfType<S extends string, T extends SyntaxNodeBase> {
  nodeType: S;
  currentNode: T;
}

type TreeCursorRecord = { [K in TypeString]: TreeCursorOfType<K, NodeOfType<K>> };

/**
 * A tree cursor whose \`nodeType\` correlates with \`currentNode\`.
 *
 * The typing becomes invalid once the underlying cursor is mutated.
 *
 * The intention is to cast a \`TreeCursor\` to \`TypedTreeCursor\` before
 * switching on \`nodeType\`.
 *
 * For example:
 * \`\`\`ts
 * let cursor = root.walk();
 * while (cursor.gotoNextSibling()) {
 *   const c = cursor as TypedTreeCursor;
 *   switch (c.nodeType) {
 *     case SyntaxType.Foo: {
 *       let node = c.currentNode; // Typed as FooNode.
 *       break;
 *     }
 *   }
 * }
 * \`\`\`
 */
export type TypedTreeCursor = TreeCursorRecord[keyof TreeCursorRecord];

export interface ErrorNode extends NamedNodeBase {
    type: SyntaxType.ERROR;
    hasError(): true;
}
`);
}

function generateTypeEnum(json, { typeNames }, printer) {
  printer
    .println("export const enum SyntaxType {")
    .indent()
    .println('ERROR = "ERROR",')
    .forEach(json, (entry) => {
      if (
        entry.named &&
        (entry.subtypes == null || entry.subtypes.length === 0)
      ) {
        let name = getSyntaxKindFromString(entry.type);
        printer.println(`${name} = ${JSON.stringify(entry.type)},`);
      }
    })
    .deindent()
    .println("}")
    .println()
    .println("export type UnnamedType =")
    .indent()
    .forEach(json, (entry) => {
      if (!entry.named) {
        let name = typeNames.get(entry.type);
        if (name != null) {
          printer.println(`| SyntaxType.${name} // both named and unnamed`);
        } else {
          printer.println(`| ${JSON.stringify(entry.type)}`);
        }
      }
    })
    .println(";")
    .deindent()
    .println()
    .println("export type TypeString = SyntaxType | UnnamedType;")
    .println();
}

function generateNamedDeclaration(entry, index, printer) {
  if (!entry.named) return;
  if (entry.subtypes != null && entry.subtypes.length > 0) {
    generateUnionFromEntry(entry, index, printer);
  } else {
    generateInterfaceFromEntry(entry, index, printer);
  }
}

function generateInterfaceFromEntry(entry, index, printer) {
  let kind = getSyntaxKindFromString(entry.type);
  let name = getTypeNameFromString(entry.type);
  printer
    .println(`export interface ${name} extends NamedNodeBase {`)
    .indent()
    .println(`type: SyntaxType.${kind};`)
    .forEachInRecord(entry.fields, (field, children) => {
      let fieldName = field + "Node";
      let type = children.types
        .map((t) => getTypeExprFromRef(t, index))
        .join(" | ");
      if (type === "") {
        type = "UnnamedNode";
      }
      if (children.multiple) {
        if (children.types.length > 1) {
          type = "(" + type + ")";
        }
        type += "[]";
        fieldName += "s";
      }
      let opt = children.required || children.multiple ? "" : "?";
      printer.println(`${fieldName}${opt}: ${type};`);
    })
    .deindent()
    .println("}")
    .println();
}

function generateUnionFromEntry(entry, index, printer) {
  generateUnion(
    getTypeNameFromString(entry.type),
    entry.subtypes,
    index,
    printer
  );
}

function generateRootUnion(json, index, printer) {
  let errorType = { type: "ERROR", named: true, isError: true };
  generateUnion("SyntaxNode", [...json, errorType], index, printer);
}

function generateUnion(name, members, index, printer) {
  printer
    .println(`export type ${name} = `)
    .indent()
    .forEach(members, (ref) => {
      printer.println("| " + getTypeExprFromRef(ref, index));
    })
    .println(";")
    .deindent()
    .println();
}

function generateModifiedTreeSitterDts(json, dtsText, printer) {
  let text = dtsText
    .replace(/declare module ['"]tree-sitter['"] {(.*)}/s, (str, p1) =>
      p1.replace(/^  /gm, "")
    )
    .replace("export = Parser", "")
    .replace(/namespace Parser {(.*)}/s, (str, p1) => p1.replace(/^  /gm, ""))
    .replace(/^\s*(class|interface|namespace)/gm, "export $1")
    .replace(/\bexport class\b/g, "export interface")
    .replace(/\bParser\.(\w+)\b/g, "$1")
    .replace("export interface SyntaxNode", "interface SyntaxNodeBase")
    .replace(
      /closest\(\w+:.*\): SyntaxNode \| null;/,
      "closest<T extends SyntaxType>(types: T | readonly T[]): NamedNode<T> | null;"
    )
    .replace(
      /descendantsOfType\(types: [^,]*, (.*)\): Array<SyntaxNode>;/,
      "descendantsOfType<T extends TypeString>(types: T | readonly T[], $1): NodeOfType<T>[];"
    )
    .replace(/\n\n\n+/g, "\n\n")
    .replace(/\n+$/, "");
  printer.println(text);
}

const usageText = `
  Usage: dts-tree-sitter INPUT
  Generates a index.d.ts file.
`;

function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (e) {
    return false;
  }
}

function getLookupLocations() {
  return ["node-types.json", "src/node-types.json"];
}

function getTreeSitterDts() {
  return fs.readFileSync("./script/tree-sitter.d.ts", "utf8").toString();
}

function addModule() {
  const { name } = JSON.parse(fs.readFileSync("package.json").toString());
  file = `declare module "${name}" {\n` + file;
  file += "\n}\n";
}

function main() {
  let locations = getLookupLocations();
  let filename = locations.find(fileExists);
  let treeSitterDtsText = getTreeSitterDts();
  if (filename == null) {
    console.error(
      `Could not find node-types.json at any of the following locations:`
    );
    locations.forEach((l) => (file += `  ${l}`));
    process.exit(1);
  }
  let json = JSON.parse(fs.readFileSync(filename, "utf8"));
  let index = buildIndex(json);
  let printer = new Printer();
  generateModifiedTreeSitterDts(json, treeSitterDtsText, printer);
  generatePreamble(json, printer);
  generateTypeEnum(json, index, printer);
  generateRootUnion(json, index, printer);
  printer.forEach(json, (t) => generateNamedDeclaration(t, index, printer));

  addModule();
  fs.writeFileSync("./index.d.ts", file);
}

main();
