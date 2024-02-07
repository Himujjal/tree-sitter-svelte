use std::path::PathBuf;

fn main() {
    let dir: PathBuf = ["src"].iter().collect(); 
    cc::Build::new()
        .include(&dir)
        .flag_if_supported("-utf-8")
        .file(dir.join("parser.c"))
        .file(dir.join("scanner.c"))
        .compile("tree-sitter-svelte");
}
