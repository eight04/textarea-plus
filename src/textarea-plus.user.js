// $inline.line("cmd:userscript-meta")
// $inline.line("../dist/textarea-plus.js")
/* eslint-env browser, greasemonkey */
/* global textareaPlus GM_config */

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

let commandExcutor, styleEl;

GM_config.setup({
  indentSize: {
    label: "Indent size",
    type: "number",
    default: 4
  },
  indentStyle: {
    label: "Indent style",
    type: "radio",
    default: "TAB",
    options: {
      TAB: "Tab",
      SPACE: "Space"
    }
  },
  completeBraces: {
    label: "Complete braces. One pair per line",
    type: "textarea",
    default: "[]\n{}\n()"
  }
}, () => {
  const options = GM_config.get();
  options.completeBraces = createMap(options.completeBraces);
  commandExcutor = textareaPlus.createCommandExcutor(options);
  if (styleEl) styleEl.remove();
  styleEl = GM_addStyle(`
    textarea {
      tab-size: ${options.indentSize};
      -moz-tab-size: ${options.indentSize};
      -o-tab-size: ${options.indentSize};
    }`
  );
  
  function createMap(text) {
    const map = {__proto__: null};
    for (const pair of text.split(/\s+/g)) {
      if (pair.length == 2) {
        map[pair[0]] = map[pair[1]];
      } else if (pair.length != 0) {
        alert(`Invalid pair: ${pair}`);
      }
    }
  }
});

window.addEventListener("keydown", function(e){
	if (!validArea(e.target) || e.ctrlKey || e.altKey) {
		return;
	}
	if (e.defaultPrevented) {
		return;
	}

  commandExcutor.run(e, () => new Editor(e.target));
});
