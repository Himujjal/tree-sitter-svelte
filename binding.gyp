{
  "targets": [
    {
      "target_name": "tree_sitter_svelte_binding",
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "src"
      ],
      "sources": [
        "src/parser.c",
        "src/scanner.c",
        "bindings/node/binding.cc"
      ],
      "cflags_c": [
        "-std=c99",
      ],
      "xcode_settings": {
        "OTHER_CCFLAGS": [
          "-std=c++14"
        ],
        'CLANG_CXX_LANGUAGE_STANDARD': 'c++14'
      }
    }
  ],
}
