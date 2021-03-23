const std = @import("std");

fn prepareTSSvelte(b: *std.build.Builder, lib: *std.build.LibExeObjStep) !void {
    const join = std.fs.path.join;
    const parser_lib = try join(b.allocator, &[_][]const u8{ "src", "parser.c" });
    const scanner_lib = try join(b.allocator, &[_][]const u8{ "src", "scanner.c" });

    lib.linkLibC();
    lib.addCSourceFile(parser_lib, &[_][]const u8{});
    lib.addCSourceFile(scanner_lib, &[_][]const u8{});
    lib.addIncludeDir("src");
}

pub fn build(b: *std.build.Builder) !void {
    // Standard release options allow the person running `zig build` to select
    // between Debug, ReleaseSafe, ReleaseFast, and ReleaseSmall.
    const mode = b.standardReleaseOptions();

    const lib = b.addStaticLibrary("tree-sitter-svelte", "bindings/zig/parser.zig");
    lib.setBuildMode(mode);
    lib.install();

    try prepareTSSvelte(b, lib);

    // -- Uncomment later --
    // try gen_parser_zig();

    var main_tests = b.addTest("src/main.zig");
    main_tests.setBuildMode(mode);

    const test_step = b.step("test", "Run library tests");
    test_step.dependOn(&main_tests.step);
}
