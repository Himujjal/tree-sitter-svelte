declare module "tree-sitter-svelte" {
  export interface Parser {
    parse(
      input: string | Input,
      previousTree?: Tree,
      options?: { bufferSize?: number; includedRanges?: Range[] }
    ): Tree;
    getLanguage(): any;
    setLanguage(language: any): void;
    getLogger(): Logger;
    setLogger(logFunc: Logger): void;
  }

  export type Point = {
    row: number;
    column: number;
  };

  export type Range = {
    startIndex: number;
    endIndex: number;
    startPosition: Point;
    endPosition: Point;
  };

  export type Edit = {
    startIndex: number;
    oldEndIndex: number;
    newEndIndex: number;
    startPosition: Point;
    oldEndPosition: Point;
    newEndPosition: Point;
  };

  export type Logger = (
    message: string,
    params: { [param: string]: string },
    type: "parse" | "lex"
  ) => void;

  export interface Input {
    seek(index: number): void;
    read(): any;
  }

  interface SyntaxNodeBase {
    tree: Tree;
    type: string;
    isNamed: boolean;
    text: string;
    startPosition: Point;
    endPosition: Point;
    startIndex: number;
    endIndex: number;
    parent: SyntaxNode | null;
    children: Array<SyntaxNode>;
    namedChildren: Array<SyntaxNode>;
    childCount: number;
    namedChildCount: number;
    firstChild: SyntaxNode | null;
    firstNamedChild: SyntaxNode | null;
    lastChild: SyntaxNode | null;
    lastNamedChild: SyntaxNode | null;
    nextSibling: SyntaxNode | null;
    nextNamedSibling: SyntaxNode | null;
    previousSibling: SyntaxNode | null;
    previousNamedSibling: SyntaxNode | null;

    hasChanges(): boolean;
    hasError(): boolean;
    isMissing(): boolean;
    toString(): string;
    child(index: number): SyntaxNode | null;
    namedChild(index: number): SyntaxNode | null;
    firstChildForIndex(index: number): SyntaxNode | null;
    firstNamedChildForIndex(index: number): SyntaxNode | null;

    descendantForIndex(index: number): SyntaxNode;
    descendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
    namedDescendantForIndex(index: number): SyntaxNode;
    namedDescendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
    descendantForPosition(position: Point): SyntaxNode;
    descendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
    namedDescendantForPosition(position: Point): SyntaxNode;
    namedDescendantForPosition(
      startPosition: Point,
      endPosition: Point
    ): SyntaxNode;
    descendantsOfType(
      types: String | Array<String>,
      startPosition?: Point,
      endPosition?: Point
    ): Array<SyntaxNode>;

    closest<T extends SyntaxType>(types: T | readonly T[]): NamedNode<T> | null;
    walk(): TreeCursor;
  }

  export interface TreeCursor {
    nodeType: string;
    nodeText: string;
    nodeIsNamed: boolean;
    startPosition: Point;
    endPosition: Point;
    startIndex: number;
    endIndex: number;
    readonly currentNode: SyntaxNode;

    reset(node: SyntaxNode): void;
    gotoParent(): boolean;
    gotoFirstChild(): boolean;
    gotoFirstChildForIndex(index: number): boolean;
    gotoNextSibling(): boolean;
  }

  export interface Tree {
    readonly rootNode: SyntaxNode;

    edit(delta: Edit): Tree;
    walk(): TreeCursor;
    getChangedRanges(other: Tree): Range[];
    getEditedRange(other: Tree): Range;
  }

  interface NamedNodeBase extends SyntaxNodeBase {
    isNamed: true;
  }

  /** An unnamed node with the given type string. */
  export interface UnnamedNode<T extends string = string>
    extends SyntaxNodeBase {
    type: T;
    isNamed: false;
  }

  type PickNamedType<Node, T extends string> = Node extends {
    type: T;
    isNamed: true;
  }
    ? Node
    : never;

  type PickType<Node, T extends string> = Node extends { type: T }
    ? Node
    : never;

  /** A named node with the given `type` string. */
  export type NamedNode<T extends SyntaxType = SyntaxType> = PickNamedType<
    SyntaxNode,
    T
  >;

  /**
   * A node with the given `type` string.
   *
   * Note that this matches both named and unnamed nodes. Use `NamedNode<T>` to pick only named nodes.
   */
  export type NodeOfType<T extends string> = PickType<SyntaxNode, T>;

  interface TreeCursorOfType<S extends string, T extends SyntaxNodeBase> {
    nodeType: S;
    currentNode: T;
  }

  type TreeCursorRecord = {
    [K in TypeString]: TreeCursorOfType<K, NodeOfType<K>>;
  };

  /**
   * A tree cursor whose `nodeType` correlates with `currentNode`.
   *
   * The typing becomes invalid once the underlying cursor is mutated.
   *
   * The intention is to cast a `TreeCursor` to `TypedTreeCursor` before
   * switching on `nodeType`.
   *
   * For example:
   * ```ts
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
   * ```
   */
  export type TypedTreeCursor = TreeCursorRecord[keyof TreeCursorRecord];

  export interface ErrorNode extends NamedNodeBase {
    type: SyntaxType.ERROR;
    hasError(): true;
  }
  export const enum SyntaxType {
    ERROR = "ERROR",
    Attribute = "attribute",
    AttributeName = "attribute_name",
    AttributeValue = "attribute_value",
    Document = "document",
    Element = "element",
    EndTag = "end_tag",
    ExprAttributeValue = "expr_attribute_value",
    QuotedAttributeValue = "quoted_attribute_value",
    ScriptElement = "script_element",
    SelfClosingTag = "self_closing_tag",
    SpecialBlockEnd = "special_block_end",
    SpecialBlockIntermediate = "special_block_intermediate",
    SpecialBlockStart = "special_block_start",
    StartTag = "start_tag",
    StyleElement = "style_element",
    AwaitTag = "await_tag",
    Catch = "catch",
    Comment = "comment",
    EachTag = "each_tag",
    ElseTag = "else_tag",
    ElseifTag = "elseif_tag",
    ErrorneousEndTagName = "errorneous_end_tag_name",
    IfTag = "if_tag",
    RawText = "raw_text",
    RawTextExpr = "raw_text_expr",
    TagName = "tag_name",
    Text = "text",
    ThenTag = "then_tag",
  }
  export type UnnamedType =
    | '"'
    | "'"
    | "/>"
    | "<"
    | "</"
    | "="
    | ">"
    | "{"
    | "{#"
    | "{/"
    | "{:"
    | "{}"
    | "}";
  export type TypeString = SyntaxType | UnnamedType;
  export type SyntaxNode =
    | AttributeNode
    | AttributeNameNode
    | AttributeValueNode
    | DocumentNode
    | ElementNode
    | EndTagNode
    | ExprAttributeValueNode
    | QuotedAttributeValueNode
    | ScriptElementNode
    | SelfClosingTagNode
    | SpecialBlockEndNode
    | SpecialBlockIntermediateNode
    | SpecialBlockStartNode
    | StartTagNode
    | StyleElementNode
    | UnnamedNode<'"'>
    | UnnamedNode<"'">
    | UnnamedNode<"/>">
    | UnnamedNode<"<">
    | UnnamedNode<"</">
    | UnnamedNode<"=">
    | UnnamedNode<">">
    | AwaitTagNode
    | CatchNode
    | CommentNode
    | EachTagNode
    | ElseTagNode
    | ElseifTagNode
    | ErrorneousEndTagNameNode
    | IfTagNode
    | RawTextNode
    | RawTextExprNode
    | TagNameNode
    | TextNode
    | ThenTagNode
    | UnnamedNode<"{">
    | UnnamedNode<"{#">
    | UnnamedNode<"{/">
    | UnnamedNode<"{:">
    | UnnamedNode<"{}">
    | UnnamedNode<"}">
    | ErrorNode;
  export interface AttributeNode extends NamedNodeBase {
    type: SyntaxType.Attribute;
  }
  export interface AttributeNameNode extends NamedNodeBase {
    type: SyntaxType.AttributeName;
  }
  export interface AttributeValueNode extends NamedNodeBase {
    type: SyntaxType.AttributeValue;
  }
  export interface DocumentNode extends NamedNodeBase {
    type: SyntaxType.Document;
  }
  export interface ElementNode extends NamedNodeBase {
    type: SyntaxType.Element;
  }
  export interface EndTagNode extends NamedNodeBase {
    type: SyntaxType.EndTag;
  }
  export interface ExprAttributeValueNode extends NamedNodeBase {
    type: SyntaxType.ExprAttributeValue;
  }
  export interface QuotedAttributeValueNode extends NamedNodeBase {
    type: SyntaxType.QuotedAttributeValue;
  }
  export interface ScriptElementNode extends NamedNodeBase {
    type: SyntaxType.ScriptElement;
  }
  export interface SelfClosingTagNode extends NamedNodeBase {
    type: SyntaxType.SelfClosingTag;
  }
  export interface SpecialBlockEndNode extends NamedNodeBase {
    type: SyntaxType.SpecialBlockEnd;
  }
  export interface SpecialBlockIntermediateNode extends NamedNodeBase {
    type: SyntaxType.SpecialBlockIntermediate;
  }
  export interface SpecialBlockStartNode extends NamedNodeBase {
    type: SyntaxType.SpecialBlockStart;
  }
  export interface StartTagNode extends NamedNodeBase {
    type: SyntaxType.StartTag;
  }
  export interface StyleElementNode extends NamedNodeBase {
    type: SyntaxType.StyleElement;
  }
  export interface AwaitTagNode extends NamedNodeBase {
    type: SyntaxType.AwaitTag;
  }
  export interface CatchNode extends NamedNodeBase {
    type: SyntaxType.Catch;
  }
  export interface CommentNode extends NamedNodeBase {
    type: SyntaxType.Comment;
  }
  export interface EachTagNode extends NamedNodeBase {
    type: SyntaxType.EachTag;
  }
  export interface ElseTagNode extends NamedNodeBase {
    type: SyntaxType.ElseTag;
  }
  export interface ElseifTagNode extends NamedNodeBase {
    type: SyntaxType.ElseifTag;
  }
  export interface ErrorneousEndTagNameNode extends NamedNodeBase {
    type: SyntaxType.ErrorneousEndTagName;
  }
  export interface IfTagNode extends NamedNodeBase {
    type: SyntaxType.IfTag;
  }
  export interface RawTextNode extends NamedNodeBase {
    type: SyntaxType.RawText;
  }
  export interface RawTextExprNode extends NamedNodeBase {
    type: SyntaxType.RawTextExpr;
  }
  export interface TagNameNode extends NamedNodeBase {
    type: SyntaxType.TagName;
  }
  export interface TextNode extends NamedNodeBase {
    type: SyntaxType.Text;
  }
  export interface ThenTagNode extends NamedNodeBase {
    type: SyntaxType.ThenTag;
  }
}
