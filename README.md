# Tree-sitter-svelte

Tree-sitter grammar for [svelte](https://svelte.dev)

# Install

```
pnpm i tree-sitter-svelte tree-sitter
```

# Usage

```javascript
const Parser = require("tree-sitter");
const Vue = require("tree-sitter-vue");

const parser = new Parser();
parser.setLanguage(Vue);

const sourceCode = `
<template>
  Hello, <a bind:variable="url">{name}</a>
</template>
`;

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
// (component
//   (template_element
//     (start_tag
//       (tag_name))
//       (text)
//       (element
//         (start_tag
//           (tag_name)
//           (directive_attribute
//             (directive_name)
//             (directive_dynamic_argument
//               (directive_dynamic_argument_value))
//             (quoted_attribute_value
//               (attribute_value))))
//         (interpolation
//           (raw_text))
//         (end_tag
//           (tag_name)))
//       (text)
//     (end_tag
//       (tag_name))))
```

# LICENSE

[MIT](./LICENSE)
