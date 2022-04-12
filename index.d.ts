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
  descendantForPosition(
    startPosition: Point,
    endPosition: Point
  ): SyntaxNode;
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

;
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

/** A named node with the given `type` string. */
export type NamedNode<T extends SyntaxType = SyntaxType> = PickNamedType<SyntaxNode, T>;

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

type TreeCursorRecord = { [K in TypeString]: TreeCursorOfType<K, NodeOfType<K>> };

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
export const enum SyntaxType {  ERROR = "ERROR",  Attribute = "attribute",  AttributeName = "attribute_name",  AttributeValue = "attribute_value",  AwaitEndExpr = "await_end_expr",  AwaitStartExpr = "await_start_expr",  AwaitStatement = "await_statement",  CatchExpr = "catch_expr",  CatchStatement = "catch_statement",  Document = "document",  EachEndExpr = "each_end_expr",  EachStartExpr = "each_start_expr",  EachStatement = "each_statement",  Element = "element",  ElseEachStatement = "else_each_statement",  ElseExpr = "else_expr",  ElseIfExpr = "else_if_expr",  ElseIfStatement = "else_if_statement",  ElseStatement = "else_statement",  EndTag = "end_tag",  ExprAttributeValue = "expr_attribute_value",  Expression = "expression",  HtmlExpr = "html_expr",  IfEndExpr = "if_end_expr",  IfStartExpr = "if_start_expr",  IfStatement = "if_statement",  KeyEndExpr = "key_end_expr",  KeyStartExpr = "key_start_expr",  KeyStatement = "key_statement",  QuotedAttributeValue = "quoted_attribute_value",  ScriptElement = "script_element",  SelfClosingTag = "self_closing_tag",  StartTag = "start_tag",  StyleElement = "style_element",  ThenExpr = "then_expr",  ThenStatement = "then_statement",  As = "as",  Comment = "comment",  ErroneousEndTagName = "erroneous_end_tag_name",  RawText = "raw_text",  RawTextAwait = "raw_text_await",  RawTextEach = "raw_text_each",  RawTextExpr = "raw_text_expr",  SpecialBlockKeyword = "special_block_keyword",  TagName = "tag_name",  Text = "text",  Then = "then",}export type UnnamedType =  | "\""  | "#"  | "'"  | "/"  | "/>"  | ":"  | "<"  | "</"  | "="  | ">"  | "@"  | "{"  | "}"  ;export type TypeString = SyntaxType | UnnamedType;export type SyntaxNode =   | AttributeNode  | AttributeNameNode  | AttributeValueNode  | AwaitEndExprNode  | AwaitStartExprNode  | AwaitStatementNode  | CatchExprNode  | CatchStatementNode  | DocumentNode  | EachEndExprNode  | EachStartExprNode  | EachStatementNode  | ElementNode  | ElseEachStatementNode  | ElseExprNode  | ElseIfExprNode  | ElseIfStatementNode  | ElseStatementNode  | EndTagNode  | ExprAttributeValueNode  | ExpressionNode  | HtmlExprNode  | IfEndExprNode  | IfStartExprNode  | IfStatementNode  | KeyEndExprNode  | KeyStartExprNode  | KeyStatementNode  | QuotedAttributeValueNode  | ScriptElementNode  | SelfClosingTagNode  | StartTagNode  | StyleElementNode  | ThenExprNode  | ThenStatementNode  | UnnamedNode<"\"">  | UnnamedNode<"#">  | UnnamedNode<"'">  | UnnamedNode<"/">  | UnnamedNode<"/>">  | UnnamedNode<":">  | UnnamedNode<"<">  | UnnamedNode<"</">  | UnnamedNode<"=">  | UnnamedNode<">">  | UnnamedNode<"@">  | AsNode  | CommentNode  | ErroneousEndTagNameNode  | RawTextNode  | RawTextAwaitNode  | RawTextEachNode  | RawTextExprNode  | SpecialBlockKeywordNode  | TagNameNode  | TextNode  | ThenNode  | UnnamedNode<"{">  | UnnamedNode<"}">  | ErrorNode  ;export interface AttributeNode extends NamedNodeBase {  type: SyntaxType.Attribute;}export interface AttributeNameNode extends NamedNodeBase {  type: SyntaxType.AttributeName;}export interface AttributeValueNode extends NamedNodeBase {  type: SyntaxType.AttributeValue;}export interface AwaitEndExprNode extends NamedNodeBase {  type: SyntaxType.AwaitEndExpr;}export interface AwaitStartExprNode extends NamedNodeBase {  type: SyntaxType.AwaitStartExpr;}export interface AwaitStatementNode extends NamedNodeBase {  type: SyntaxType.AwaitStatement;}export interface CatchExprNode extends NamedNodeBase {  type: SyntaxType.CatchExpr;}export interface CatchStatementNode extends NamedNodeBase {  type: SyntaxType.CatchStatement;}export interface DocumentNode extends NamedNodeBase {  type: SyntaxType.Document;}export interface EachEndExprNode extends NamedNodeBase {  type: SyntaxType.EachEndExpr;}export interface EachStartExprNode extends NamedNodeBase {  type: SyntaxType.EachStartExpr;}export interface EachStatementNode extends NamedNodeBase {  type: SyntaxType.EachStatement;}export interface ElementNode extends NamedNodeBase {  type: SyntaxType.Element;}export interface ElseEachStatementNode extends NamedNodeBase {  type: SyntaxType.ElseEachStatement;}export interface ElseExprNode extends NamedNodeBase {  type: SyntaxType.ElseExpr;}export interface ElseIfExprNode extends NamedNodeBase {  type: SyntaxType.ElseIfExpr;}export interface ElseIfStatementNode extends NamedNodeBase {  type: SyntaxType.ElseIfStatement;}export interface ElseStatementNode extends NamedNodeBase {  type: SyntaxType.ElseStatement;}export interface EndTagNode extends NamedNodeBase {  type: SyntaxType.EndTag;}export interface ExprAttributeValueNode extends NamedNodeBase {  type: SyntaxType.ExprAttributeValue;}export interface ExpressionNode extends NamedNodeBase {  type: SyntaxType.Expression;}export interface HtmlExprNode extends NamedNodeBase {  type: SyntaxType.HtmlExpr;}export interface IfEndExprNode extends NamedNodeBase {  type: SyntaxType.IfEndExpr;}export interface IfStartExprNode extends NamedNodeBase {  type: SyntaxType.IfStartExpr;}export interface IfStatementNode extends NamedNodeBase {  type: SyntaxType.IfStatement;}export interface KeyEndExprNode extends NamedNodeBase {  type: SyntaxType.KeyEndExpr;}export interface KeyStartExprNode extends NamedNodeBase {  type: SyntaxType.KeyStartExpr;}export interface KeyStatementNode extends NamedNodeBase {  type: SyntaxType.KeyStatement;}export interface QuotedAttributeValueNode extends NamedNodeBase {  type: SyntaxType.QuotedAttributeValue;}export interface ScriptElementNode extends NamedNodeBase {  type: SyntaxType.ScriptElement;}export interface SelfClosingTagNode extends NamedNodeBase {  type: SyntaxType.SelfClosingTag;}export interface StartTagNode extends NamedNodeBase {  type: SyntaxType.StartTag;}export interface StyleElementNode extends NamedNodeBase {  type: SyntaxType.StyleElement;}export interface ThenExprNode extends NamedNodeBase {  type: SyntaxType.ThenExpr;}export interface ThenStatementNode extends NamedNodeBase {  type: SyntaxType.ThenStatement;}export interface AsNode extends NamedNodeBase {  type: SyntaxType.As;}export interface CommentNode extends NamedNodeBase {  type: SyntaxType.Comment;}export interface ErroneousEndTagNameNode extends NamedNodeBase {  type: SyntaxType.ErroneousEndTagName;}export interface RawTextNode extends NamedNodeBase {  type: SyntaxType.RawText;}export interface RawTextAwaitNode extends NamedNodeBase {  type: SyntaxType.RawTextAwait;}export interface RawTextEachNode extends NamedNodeBase {  type: SyntaxType.RawTextEach;}export interface RawTextExprNode extends NamedNodeBase {  type: SyntaxType.RawTextExpr;}export interface SpecialBlockKeywordNode extends NamedNodeBase {  type: SyntaxType.SpecialBlockKeyword;}export interface TagNameNode extends NamedNodeBase {  type: SyntaxType.TagName;}export interface TextNode extends NamedNodeBase {  type: SyntaxType.Text;}export interface ThenNode extends NamedNodeBase {  type: SyntaxType.Then;}
}
