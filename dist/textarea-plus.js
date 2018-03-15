var textareaPlus = (function () {
'use strict';

/* eslint-env node */

function isSameLine(editor) {
  return !editor.getSelection().includes("\n");
}

function getIndentInfo(text, {indentSize}) {
  var i, count = 0;
  for (i = 0; i < text.length; i++) {
    var c = text[i];
    if (c == " ") {
      count++;
    } else if (c == "\t") {
      count += indentSize;
    } else {
      break;
    }
  }
  return {
    count: Math.floor(count / indentSize),
    extraSpaces: count % indentSize,
    length: i
  };
}

function getIndentChar({indentStyle, indentSize}) {
  if (indentStyle === "TAB") {
    return "\t";
  }
  return " ".repeat(indentSize);
}

function runIndent({editor, options}) {
  if (!isSameLine(editor)) {
    runMultiIndent(editor, options);
    return;
  }
  var range = editor.getSelectionLineRange(),
    line = editor.getSelectionLine(),
    indent = getIndentInfo(line, options),
    pos = editor.getSelectionRange().start;
  if (pos > range.start + indent.length) {
    editor.setRangeText(
      getIndentChar(options),
      pos,
      pos,
      "end"
    );
  } else {
    editor.setRangeText(
      getIndentChar(options).repeat(indent.count + 1),
      range.start,
      range.start + indent.length,
      "end"
    );
  }
}

function runUnindent({editor, options}) {
  if (!isSameLine(editor)) {
    runMultiIndent(editor, options, -1);
    return;
  }
  var range = editor.getSelectionLineRange(),
    line = editor.getSelectionLine(),
    indent = getIndentInfo(line, options),
    pos = editor.getCaretPos(true),
    indentChar = getIndentChar(options);
    
  const indentCount = indent.count + (indent.extraSpaces ? 1 : 0);
  if (pos <= range.start + indent.length && indentCount) {
    editor.setRangeText(
      indentChar.repeat(indentCount - 1),
      range.start,
      range.start + indent.length,
      "end"
    );
  } else if (line.slice(0, pos - range.start).endsWith(indentChar)) {
    editor.setRangeText(
      "", pos - indentChar.length, pos, "end"
    );
  }
}

function runMultiIndent(editor, options, diff = 1) {
  var range = editor.getSelectionRange(),
    lines = editor.getSelectionLine(),
    lineRange = editor.getSelectionLineRange();
  if (lines[range.end - lineRange.start - 1] == "\n") {
    lineRange.end = range.end - 1;
    lines = lines.slice(0, range.end - lineRange.start - 1);
  }
  lines = lines.split("\n").map(line => {
    if (!line) return line;
    var indent = getIndentInfo(line, options),
      count = indent.count + diff;
    if (count < 0) {
      count = 0;
      // remove extra space when there is no indent
      indent.extraSpaces = 0;
    }
    return getIndentChar(options).repeat(count) +
      " ".repeat(indent.extraSpaces) +
      line.slice(indent.length);
  }).join("\n");
  editor.setRangeText(lines, lineRange.start, lineRange.end);
  editor.setSelectionRange(lineRange.start, lineRange.start + lines.length + 1);
}

function runSmartHome({editor, options, event}) {
  const collapse = !event.shiftKey;
  var line = editor.getCurrentLine(),
    range = editor.getCurrentLineRange(),
    pos = editor.getCaretPos(collapse) - range.start,
    indent = getIndentInfo(line, options);
  if (pos == indent.length) {
    editor.setCaretPos(range.start, collapse);
  } else {
    editor.setCaretPos(range.start + indent.length, collapse);
  }
}

const BRACES = {
  __proto__: null,
  "[": "]",
  "{": "}",
  "(": ")",
};

function runNewLine({editor, options}) {
  var content = editor.getContent(),
    range = editor.getSelectionRange(),
    line = editor.getSelectionLine(),
    lineRange = editor.getLineRange(range.start, range.start),
    indent = getIndentInfo(line, options),
    out = "\n", pos,
    left = content[range.start - 1],
    right = content[range.end];

  if (/[[{(]/.test(left)) {
    out += getIndentChar(options).repeat(indent.count + 1);
  } else {
    out += line.slice(0, Math.min(indent.length, range.start - lineRange.start));
  }
  pos = range.start + out.length;
  if (BRACES[left] && right == BRACES[left]) {
    out += "\n" + line.slice(0, indent.length);
  }
  editor.setRangeText(out);
  editor.setSelectionRange(pos, pos);
}

function runCompleteBraces({editor, options, event}) {
  const left = event.key;
  const right = options.completeBraces[left];
  var text = editor.getSelection(),
    range = editor.getSelectionRange();
  editor.setRangeText(left + text + right, range.start, range.end);
  editor.setSelectionRange(range.start + 1, range.start + 1 + text.length);
}

const COMMANDS = [
  {
    // indent
    test: e => e.key === "Tab" && !e.shiftKey,
    run: runIndent
  },
  {
    // unindent
    test: e => e.key === "Tab" && e.shiftKey,
    run: runUnindent
  },
  {
    // smart home
    test: e => e.key === "Home",
    run: runSmartHome
  },
  {
    // new line
    test: e => e.key === "Enter",
    run: runNewLine
  },
  {
    // complete braces
    test: (e, {completeBraces}) => completeBraces[e.key],
    run: runCompleteBraces
  }
];

const DEFAULT_OPTIONS = {
  indentSize: 4,
  indentStyle: "TAB",
  completeBraces: {
    __proto__: null,
    "[": "]",
    "{": "}",
    "(": ")",
    "\"": "\"",
    "'": "'"
  }
};

function createCommandExecutor(options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  
  function run(event, editorFactory) {
    for (const command of COMMANDS) {
      if (command.test(event, options)) {
        event.preventDefault();
        command.run({editor: editorFactory(), options, event});
        break;
      }
    }
  }

	return {run};
}

var textareaPlus = {createCommandExecutor};

return textareaPlus;

}());
