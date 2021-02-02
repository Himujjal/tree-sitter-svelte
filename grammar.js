/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "svelte",

  externals: ($) => [
    $._start_tag_name,
    $._script_start_tag_name,
    $._style_start_tag_name,
    $._end_tag_name,
    $.errorneous_end_tag_name,
    "/>",
    $._implicit_end_tag,
    $.raw_text,
    $.raw_text_expr,
    $.comment,
  ],

  extras: () => [/\s+/],

  rules: {
    document: ($) => repeat($._node),

    _node: ($) =>
      choice(
        $.comment,
        $._text,
        $.script_element,
        $.style_element,
        $.html_block,
        $.element,
        $.special_block_start,
        $.special_block_intermediate,
        $.special_block_end
      ),

    element: ($) =>
      choice(
        seq(
          $.start_tag,
          repeat($._node),
          choice($.end_tag, $._implicit_end_tag)
        ),
        $.self_closing_tag
      ),

    html_block: ($) => seq("{@html", optional($.raw_text_expr), "}"),

    special_block_start: ($) =>
      seq("{#", $._special_block_start_tag, $.raw_text_expr, "}"),
    _special_block_start_tag: ($) =>
      choice(
        alias("if", $.if_tag),
        alias("each", $.each_tag),
        alias("await", $.await_tag)
      ),

    special_block_intermediate: ($) =>
      seq(
        "{:",
        $._special_block_intermediate_tag,
        optional($.raw_text_expr),
        "}"
      ),
    _special_block_intermediate_tag: ($) =>
      choice(
        alias(choice(seq("else if"), "elseif"), $.elseif_tag),
        alias("else", $.else_tag),
        alias("then", $.then_tag),
        alias("catch", $.catch)
      ),

    special_block_end: ($) => seq("{/", $._special_block_end_tag, "}"),
    _special_block_end_tag: ($) =>
      choice(
        alias("if", $.if_tag),
        alias("each", $.each_tag),
        alias("await", $.await_tag)
      ),

    start_tag: ($) =>
      seq("<", alias($._start_tag_name, $.tag_name), repeat($.attribute), ">"),

    self_closing_tag: ($) =>
      seq("<", alias($._start_tag_name, $.tag_name), repeat($.attribute), "/>"),

    end_tag: ($) => seq("</", alias($._end_tag_name, $.tag_name), ">"),

    errorneous_end_tag: ($) => seq("</", $.errorneous_end_tag_name, ">"),

    // -------- script and style element ---------
    script_element: ($) =>
      seq(
        alias($.script_start_tag, $.start_tag),
        optional($.raw_text),
        $.end_tag
      ),
    script_start_tag: ($) =>
      seq(
        "<",
        alias($._script_start_tag_name, $.tag_name),
        repeat($.attribute),
        ">"
      ),

    style_element: ($) =>
      seq(
        alias($.style_start_tag, $.start_tag),
        optional($.raw_text),
        $.end_tag
      ),
    style_start_tag: ($) =>
      seq(
        "<",
        alias($._style_start_tag_name, $.tag_name),
        repeat($.attribute),
        ">"
      ),
    // -------------------------------------------

    // ------- svelte attribute --------
    attribute: ($) =>
      choice(
        seq(
          $.attribute_name,
          optional(
            seq(
              "=",
              choice(
                $.attribute_value,
                $.quoted_attribute_value,
                $.expr_attribute_value
              )
            )
          )
        ),
        alias($._expression, $.attribute_name)
      ),

    attribute_name: () => /[^<>{}"'/=\s]+/,
    attribute_value: ($) => /[^<>{}"'/=\s]+/,
    expr_attribute_value: ($) => $._expression,
    quoted_attribute_value: ($) =>
      choice(
        seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
        seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"')
      ),

    // ------- svelte text ----------
    _text: ($) => choice(alias(/[^<>{}\s]+/, $.text), $._expression),

    _expression: ($) => choice(seq("{", optional($.raw_text_expr), "}"), "{}"),
  },
});
