/* eslint-env node, mocha */

import {assert} from "chai";
import {createCommandExecutor} from "../index.mjs";

describe("commandExecutor.run", () => {
  function createTest(event) {
    if (typeof event === "string") {
      event = {key: event};
    }
    event.preventDefault = () => {};
    return function (input, output) {
      const editor = createEditor(input);
      createCommandExecutor().run(event, () => editor);
      assert.equal(editor.getOutput(), output);
    };
    
    function createEditor(input) {
      let range = {start: 0, end: 0, direction: null};
      let consumedCharLength = 0;
      let value = input.replace(/[|[\]]/g, (match, offset) => {
        if (match === "|") {
          range.start = range.end = offset - consumedCharLength;
        } else if (match === "[") {
          range.start = offset - consumedCharLength;
        } else {
          range.end = offset - consumedCharLength;
        }
        consumedCharLength++;
        return "";
      });
      
      if (range.start > range.end) {
        [range.start, range.end] = [range.end, range.start];
        range.direction = "backward";
      }
      
      return {
        getSelectionRange() {
          return Object.assign({}, range);
        },
        setSelectionRange(start, end) {
          range.start = start;
          range.end = end;
        },
        getCaretPos(collapse = false) {
          if (range.direction == "backward" || collapse) {
            return range.start;
          }
          return range.end;
        },
        setCaretPos(pos, collapse = false) {
          if (collapse) {
            this.setSelectionRange(pos, pos);
          } else {
            var {start, end, direction: dir} = range;
              
            if (dir == "backward") {
              [start, end] = [end, start];
              dir = "forward";
            }
            end = pos;
            if (end < start) {
              [start, end] = [end, start];
              dir = "backward";
            }
            range = {start, end, direction: dir};
          }
        },
        getLineRange(start, end) {
          var content = this.getContent(),
            i, j;
          i = content.lastIndexOf("\n", start - 1) + 1;
          j = content.indexOf("\n", end);
          if (j < 0) {
            j = content.length;
          }
          return {
            start: i,
            end: j
          };
        },
        getSelectionLineRange() {
          var range = this.getSelectionRange();
          return this.getLineRange(range.start, range.end);
        },
        getSelectionLine() {
          var content = this.getContent(),
            range = this.getSelectionLineRange();
          return content.slice(range.start, range.end);
        },
        getCurrentLineRange() {
          var pos = this.getCaretPos();
          return this.getLineRange(pos, pos);
        },
        getCurrentLine() {
          var range = this.getCurrentLineRange(),
            content = this.getContent();
          return content.slice(range.start, range.end);
        },
        getContent() {
          return value;
        },
        getSelection() {
          var content = this.getContent(),
            range = this.getSelectionRange();
          return content.slice(range.start, range.end);
        },
        setRangeText(text, start, end, selectionMode) {
          if (start == null && end == null) {
            ({start, end} = range);
          }
          value = value.slice(0, start) + text + value.slice(end);
          if (selectionMode == "select") {
            range.start = start;
            range.end = start + text.length;
          } else if (selectionMode == "start") {
            range.start = start;
            range.end = start;
          } else if (selectionMode == "end") {
            range.start = start + text.length;
            range.end = start + text.length;
          } else {
            range.start = Math.min(range.start, value.length);
            range.end = Math.min(range.end, value.length);
          }
        },
        getOutput() {
          if (range.start === range.end) {
            return value.slice(0, range.start) + "|" + value.slice(range.start);
          }
          return value.slice(0, range.start) +
            "[" + value.slice(range.start, range.end) + "]" +
            value.slice(range.end);
        }
      }
    }
  }
  
  it("indent", () => {
    const test = createTest("Tab");
    test("abc|", "abc\t|");
    test("|abc", "\t|abc");
    test("a|bc", "a\t|bc");
    test("|\tabc", "\t\t|abc");
    // extra spaces
    test(" |abc", "\t|abc");
  });
  
  it("unindent", () => {
    const test = createTest({key: "Tab", shiftKey: true});
    test("abc\t|", "abc|");
    test("\t|abc", "|abc");
    test("a\t|bc", "a|bc");
    test("|\tabc", "|abc");
    // extra spaces
    test(" |abc", "|abc");
  });
  
  it("multiline indent", () => {
    const test = createTest("Tab");
    test("a[bc\nab]c", "[\tabc\n\tabc]");
    test("a[bc\n\tab]c", "[\tabc\n\t\tabc]");
    // extra spaces
    test("a[bc\n\tabc\n\t  ab]c", "[\tabc\n\t\tabc\n\t\t  abc]");
  });
  
  it("multiline unindent", () => {
    const test = createTest({key: "Tab", shiftKey: true});
    test("\ta[bc\n\tab]c", "[abc\nabc]");
    test("\ta[bc\n\t\tab]c", "[abc\n\tabc]");
    test("\ta[bc\n\t\tabc\n\t\t  ab]c", "[abc\n\tabc\n\t  abc]");
    // extra spaces
    test("a[bc\n ab]c", "[abc\nabc]");
  });
  
  it("smarthome", () => {
    const test = createTest("Home");
    test("  a|bc", "  |abc");
    test("  |abc", "|  abc");
    test(" | abc", "  |abc");
    test("|  abc", "  |abc");
  });
  
  it("smarthome selection", () => {
    const test = createTest({key: "Home", shiftKey: true});
    test("  a[b]c", "  [a]bc");
    test("  a]b[c", "  [ab]c");
    test("  ]ab[c", "[  ab]c");
    test(" | abc", " [ ]abc");
    test(" [ ]abc", "[ ] abc");
    test("] [ abc", " [ ]abc");
    test("[ ] abc", "[  ]abc");
    test("[  ]abc", "|  abc");
  });
  
  it("new line", () => {
    const test = createTest("Enter");
    test("abc|", "abc\n|");
    test("\tabc|", "\tabc\n\t|");
    test("{|}", "{\n\t|\n}");
  });
  
  it("complete braces", () => {
    const test = createTest("(");
    test("|", "(|)");
    test("[abc]", "([abc])");
  });
});
