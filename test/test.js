const Parser = require('tree-sitter')
const HTML = require('tree-sitter-html')

const Svelte = require("../index")


const parser = new Parser()
parser.setLanguage(Svelte)

const sourceCode = require('fs').readFileSync("test/test.svelte").toString()

const tree = parser.parse(sourceCode)

console.log(tree.rootNode.toString())

