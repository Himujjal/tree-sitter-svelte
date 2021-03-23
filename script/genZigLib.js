const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const filePath = path.join("src", "tree_sitter", "parser.h");
const filePathZig = path.join("bindings", "zig", "parser.zig");

exec(`zig translate-c ${filePath} -lc`, (error, stdout, stderr) => {
  const newFile = stdout.trim() + "\n" + "pub extern fn tree_sitter_svelte() ?*TSLanguage;\n";
  fs.writeFileSync(filePathZig, newFile);
});
