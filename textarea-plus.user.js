// ==UserScript==
// @name        Textarea Plus
// @description	An userscript to improve plain textarea for code editing.
// @namespace   eight04.blogspot.com
// @include     *
// @version     2.0.1
// @grant       GM_addStyle
// ==/UserScript==

class Editor {
	constructor(textarea) {
		this.el = textarea;
	}

	getSelectionRange() {
		return {
			start: this.el.selectionStart,
			end: this.el.selectionEnd
		};
	}

	setSelectionRange(start, end) {
		this.el.setSelectionRange(start, end);
	}

	getCaretPos(collapse = false) {
		if (this.el.selectionDirection == "backward" || collapse) {
			return this.el.selectionStart;
		}
		return this.el.selectionEnd;
	}
	
	setCaretPos(pos, collapse = false) {
		if (collapse) {
			this.setSelectionRange(pos, pos);
		} else {
			var start = this.el.selectionStart,
				end = this.el.selectionEnd,
				dir = this.el.selectionDirection;
				
			if (dir == "backward") {
				[start, end] = [end, start];
				dir = "forward";
			}
			end = pos;
			if (end < start) {
				[start, end] = [end, start];
				dir = "backward";
			}
			this.el.selectionEnd = end;
			this.el.selectionStart = start;
			this.el.selectionDirection = dir;
		}
	}

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
	}

	getSelectionLineRange() {
		var range = this.getSelectionRange();
		return this.getLineRange(range.start, range.end);
	}

	getSelectionLine() {
		var content = this.getContent(),
			range = this.getSelectionLineRange();
		return content.slice(range.start, range.end);
	}

	getCurrentLineRange() {
		var pos = this.getCaretPos();
		return this.getLineRange(pos, pos);
	}

	getCurrentLine() {
		var range = this.getCurrentLineRange(),
			content = this.getContent();
		return content.slice(range.start, range.end);
	}

	getContent() {
		return this.el.value;
	}

	getSelection() {
		var content = this.getContent(),
			range = this.getSelectionRange();
		return content.slice(range.start, range.end);
	}

	setRangeText(...args) {
		this.el.setRangeText(...args);
	}
}

var braceMatch = {
	"[": "]",
	"{": "}",
	"(": ")"
};

class Commands {
	constructor(editor) {
		this.editor = editor;
		this.indentSize = 4;
		this.indentChar = "\t";
	}
	sameLine() {
		return !this.editor.getSelection().includes("\n");
	}
	betweenText() {
		var line = this.editor.getSelectionLine(),
			pos = this.editor.getCaretPos(),
			lineRange = this.editor.getSelectionLineRange(),
			match = line.match(/\S/);
		if (!match) {
			return false;
		}
		return pos >= lineRange.start + match.index;
	}
	getIndentInfo(text) {
		var i, count = 0;
		for (i = 0; i < text.length; i++) {
			var c = text[i];
			if (c == " ") {
				count++;
			} else if (c == "\t") {
				count += 4;
			} else {
				break;
			}
		}
		return {
			count: Math.floor(count / this.indentSize),
			length: i
		};
	}
	indent() {
		if (this.sameLine()) {
			var range = this.editor.getSelectionLineRange(),
				line = this.editor.getSelectionLine(),
				indent = this.getIndentInfo(line),
				pos = this.editor.getSelectionRange().start;
			if (pos >= range.start + indent.length) {
				this.editor.setRangeText(
					this.indentChar,
					pos,
					pos,
					"end"
				);
			} else {
				this.editor.setRangeText(
					this.indentChar.repeat(indent.count + 1),
					range.start,
					range.start + indent.length,
					"end"
				);
			}
		} else {
			this.multiIndent();
		}
		return true;
	}
	multiIndent(diff = 1) {
		var range = this.editor.getSelectionRange(),
			lines = this.editor.getSelectionLine(),
			lineRange = this.editor.getSelectionLineRange();
		if (lines[range.end - lineRange.start - 1] == "\n") {
			lineRange.end = range.end - 1;
			lines = lines.slice(0, range.end - lineRange.start - 1);
		}
		lines = lines.split("\n").map(line => {
			if (!line) return line;
			var indent = this.getIndentInfo(line),
				count = indent.count + diff;
			if (count < 0) count = 0;
			return this.indentChar.repeat(count) + line.slice(indent.length);
		}).join("\n");
		this.editor.setRangeText(lines, lineRange.start, lineRange.end);
		this.editor.setSelectionRange(lineRange.start, lineRange.start + lines.length + 1);
	}
	unindent() {
		if (this.sameLine()) {
			var range = this.editor.getSelectionLineRange(),
				line = this.editor.getSelectionLine(),
				indent = this.getIndentInfo(line),
				pos = this.editor.getCaretPos(true);
			if (pos <= range.start + indent.length && indent.count) {
				this.editor.setRangeText(
					this.indentChar.repeat(indent.count - 1),
					range.start,
					range.start + indent.length,
					"end"
				);
			} else if (line.slice(0, pos - range.start).endsWith(this.indentChar)) {
				this.editor.setRangeText(
					"", pos - this.indentChar.length, pos, "end"
				);
			}
		} else {
			this.multiIndent(-1);
		}
		return true;
	}
	smartHome(collapse = false) {
		var line = this.editor.getCurrentLine(),
			range = this.editor.getCurrentLineRange(),
			pos = this.editor.getCaretPos(collapse) - range.start,
			indent = this.getIndentInfo(line);
		if (pos == indent.length) {
			this.editor.setCaretPos(range.start, collapse);
		} else {
			this.editor.setCaretPos(range.start + indent.length, collapse);
		}
		return true;
	}
	newLineIndent() {
		var content = this.editor.getContent(),
			range = this.editor.getSelectionRange(),
			line = this.editor.getSelectionLine(),
			lineRange = this.editor.getLineRange(range.start, range.start),
			indent = this.getIndentInfo(line),
			out = "\n", pos,
			left = content[range.start - 1],
			right = content[range.end];

		if (/[\[{(]/.test(left)) {
			out += this.indentChar.repeat(indent.count + 1);
		} else {
			out += line.slice(0, Math.min(indent.length, range.start - lineRange.start));
		}
		pos = range.start + out.length;
		if (right == braceMatch[left]) {
			out += "\n" + line.slice(0, indent.length);
		}
		this.editor.setRangeText(out);
		this.editor.setSelectionRange(pos, pos);
		return true;
	}
	completeBraces(left) {
		var right = braceMatch[left];
		if (!right) return false;
		var text = this.editor.getSelection(),
			range = this.editor.getSelectionRange();
		this.editor.setRangeText(left + text + right, range.start, range.end);
		this.editor.setSelectionRange(range.start + 1, range.start + 1 + text.length);
		return true;
	}
}

var ignoreClassList = ["CodeMirror", "ace_editor"];

function validArea(area) {
	if (area.nodeName != "TEXTAREA") {
		return false;
	}

	if (area.dataset.textareaPlus === "false") {
		return false;
	}

	if (area.dataset.textareaPlus === "true") {
		return true;
	}

	var node = area, i;
	while ((node = node.parentNode) != document.body) {
		for (i = 0; i < ignoreClassList.length; i++) {
			if (node.classList.contains(ignoreClassList[i])) {
				area.dataset.textareaPlus = "false";
				return false;
			}
		}
	}

	area.dataset.textareaPlus = "true";
	return true;
}

window.addEventListener("keydown", function(e){
	if (!validArea(e.target) || e.ctrlKey || e.altKey) {
		return;
	}
	if (e.defaultPrevented) {
		return;
	}

	function commands() {
		return new Commands(new Editor(e.target));
	}

	var result = false;

	if (e.keyCode == 9) {
		// tab
		if (e.shiftKey) {
			result = commands().unindent();
		} else {
			result = commands().indent();
		}
	} else if (e.keyCode == 13) {
		// enter
		result = commands().newLineIndent();
	} else if (e.keyCode == 36) {
		// home
		result = commands().smartHome(!e.shiftKey);
	} else if (braceMatch[e.key]) {
		// braces
		result = commands().completeBraces(e.key);
	}

	if (result) {
		e.preventDefault();
	}
});

GM_addStyle("textarea {tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;}");
