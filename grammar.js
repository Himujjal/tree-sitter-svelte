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
    $.raw_text_await,
    $.raw_text_each,
    $.comment,
  ],

  extras: () => [/\s+/],

  rules: {
    document: ($) => repeat($._node),

    _node: ($) => choice($.script_element, $.style_element, $._statement),

    _statement: ($) =>
      choice(
        $.comment,
        $._text,
        $.element,
        $.if_statement,
        $.each_statement,
        $.await_statement
      ),

    element: ($) =>
      choice(
        seq(
          $.start_tag,
          repeat($._statement),
          choice($.end_tag, $._implicit_end_tag)
        ),
        $.self_closing_tag
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
        alias($.expression, $.attribute_name)
      ),

    attribute_name: () => /[^<>{}"'/=\s]+/,
    attribute_value: ($) => /[^<>{}"'/=\s]+/,
    expr_attribute_value: ($) => $.expression,
    quoted_attribute_value: ($) =>
      choice(
        seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
        seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"')
      ),

    _text: ($) => choice(alias(/[^<>{}]+/, $.text), $._expression),

    _expression: ($) =>
      choice($.expression, $.html_expr, alias("{}", $.expression)),

    expression: ($) => seq("{", $.raw_text_expr, "}"),

    html_expr: ($) => seq("{", "@html", optional($.raw_text_expr), "}"),
    // ------------ if-else ------------------

    if_statement: ($) =>
      seq(
        $.if_start_expr,
        repeat($._statement),
        choice($.else_if_statement, $.else_statement, $.if_end_expr)
      ),

    else_if_statement: ($) =>
      seq(
        $.else_if_expr,
        repeat($._statement),
        choice($.if_end_expr, $.else_statement, $.else_if_statement)
      ),

    else_statement: ($) =>
      seq($.else_expr, repeat($._statement), $.if_end_expr),

    if_start_expr: ($) => seq("{", "#if", $.raw_text_expr, "}"),

    else_expr: ($) => seq("{", ":else", "}"),

    else_if_expr: ($) =>
      seq("{", ":else", "if", optional($.raw_text_expr), "}"),

    if_end_expr: ($) => seq("{", "/if", "}"),

    // ----------- each and await ------------

    each_statement: ($) =>
      seq($.each_start_expr, repeat($._statement), $.each_end_expr),

    each_start_expr: ($) =>
      seq(
        "{",
        "#each",
        choice(
          $.raw_text_expr,
          seq($.raw_text_each, alias("as", $.as), $.raw_text_expr)
        ),
        "}"
      ),

    each_end_expr: () => seq("{", "/each", "}"),

    await_statement: ($) =>
      prec.right(
        seq(
          $.await_start_expr,
          repeat($._statement),
          choice($.then_statement, $.catch_statement, $.await_end_expr)
        )
      ),

    then_statement: ($) =>
      seq(
        $.then_expr,
        repeat($._statement),
        choice($.await_end_expr, $.catch_statement)
      ),

    catch_statement: ($) =>
      seq($.catch_expr, repeat($._statement), $.await_end_expr),

    await_start_expr: ($) =>
      seq(
        "{",
        "#await",
        choice(
          $.raw_text_expr,
          seq($.raw_text_await, alias("then", $.then), $.raw_text_expr)
        ),
        "}"
      ),
    then_expr: ($) => seq("{", ":then", optional($.raw_text_expr), "}"),
    catch_expr: ($) => seq("{", ":catch", optional($.raw_text_expr), "}"),
    await_end_expr: ($) => seq("{", "/await", "}"),
  },
});
