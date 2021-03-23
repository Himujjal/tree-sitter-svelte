# Tree-sitter-svelte

Tree-sitter grammar for [svelte](https://svelte.dev)

# Install

```
npm i tree-sitter-svelte tree-sitter
```

# Usage

To get started with exploring the grammar in a web-ui. Run:

NOTE: `emcc` must be installed and in your path 
```sh
npm run ui
```

To use the grammar from javascript:

```javascript
const Parser = require("tree-sitter");
const Svelte = require("tree-sitter-svelte");

const parser = new Parser();
parser.setLanguage(Svelte);

const sourceCode = `
<script context="module">
    let name = 'world';
</script>
<h1>Hello {name'<>{}``"\\''""``{}}!</h1>
`;

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());

// (document
//    (script_element
//        (start_tag (tag_name)
//            (attribute (attribute_name) (quoted_attribute_value (attribute_value))))
//        (raw_text)
//        (end_tag (tag_name))
//    )
//    (element
//        (start_tag (tag_name))
//        (text) (raw_text_expr) (text)
//        (end_tag (tag_name)
//    )
//  )
//)

```

# Languages supported:

- [x] JavaScript/TypeScript
- [x] Rust
- [ ] Go
- [x] Zig
- [ ] Nim
- [ ] Python

# LICENSE

[MIT](./LICENSE)
