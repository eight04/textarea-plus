// ==UserScript==
// @name        Textarea Plus
// @description	An userscript to improve plain textarea for code editing.
// @namespace   eight04.blogspot.com
// @include     http*
// @version     1.1.1
// @grant       GM_addStyle
// ==/UserScript==

"use strict";

var ignoreClassList = ["CodeMirror", "ace_editor"];

var textareaPlus = function(){

	var editor = {
		indent: indent,
		unindent: unindent,
		home: home,
		selectHome: selectHome,
		enter: enter,
		brace0: brace0,
		brace1: brace1
	};

	function selectionRange(data){
		return data.pos[1] - data.pos[0];
	}

	function takeRange(data) {
		if (data.pos[0] > data.pos[1]) {
			return [data.pos[1], data.pos[0]];
		}
		return data.pos;
	}

	function insert(data, text){
		var pos = takeRange(data);
		data.text = data.text.substr(0, pos[0]) + text + data.text.substr(pos[1]);
		data.pos[0] = pos[0] + text.length;
		data.pos[1] = data.pos[0];
	}

	function del(data){
		if (!selectionRange(data)) {
			data.pos[1]++;
		}
		insert(data, "");
	}

	function getLineStart(data, pos){
		if (pos == undefined) {
			pos = data.pos[1];
		}

		if (data.text[pos] == "\n") {
			pos--;
		}

		var s = data.text.lastIndexOf("\n", pos);
		if (s < 0) {
			return 0;
		}
		return s + 1;
	}

	function getLineEnd(data, pos){
		if (pos == undefined) {
			pos = data.pos[1];
		}
		var s = data.text.indexOf("\n", pos);
		if (s < 0) {
			return data.text.length;
		}
		return s;
	}

	function multiIndent(data){
		var pos = takeRange(data);
		var lineStart = getLineStart(data, pos[0]), lineEnd = getLineEnd(data, pos[1]);
		var lines = data.text.substr(lineStart, lineEnd - lineStart);
		var i;

		lines = lines.split("\n");
		for (i = 0; i < lines.length; i++) {
			lines[i] = "\t" + lines[i];
		}
		lines = lines.join("\n");
		data.text = data.text.substr(0, lineStart) + lines + data.text.substr(lineEnd);
		if (data.pos[0] > data.pos[1]) {
			data.pos[1] = lineStart;
			data.pos[0] = lineEnd + i;
		} else {
			data.pos[0] = lineStart;
			data.pos[1] = lineEnd + i;
		}
	}

	function inMultiLine(data) {
		var pos = takeRange(data);
		var s = data.text.indexOf("\n", pos[0]);
		if (s < 0) {
			return false;
		}
		return  s < pos[1];
	}

	function indent(data){
		if (!selectionRange(data)) {
			insert(data, "\t");
			if (data.pos[0] < getTextStart(data)) {
				home(data);
			}
		} else {
			if (inMultiLine(data)) {
				multiIndent(data);
			} else {
				insert(data, "\t");
			}
		}
	}

	function multiUnindent(data){
		var pos = takeRange(data);
		var lineStart = getLineStart(data, pos[0]), lineEnd = getLineEnd(data, pos[1]);
		var lines = data.text.substr(lineStart, lineEnd - lineStart);
		var i, m;

		lines = lines.split("\n");
		var len = 0;
		for (i = 0; i < lines.length; i++) {
			m = lines[i].match(/^( {4}| {0,3}\t?)(.*)$/);
			// console.log(m);
			len += m[1].length;
			lines[i] = m[2];
		}
		lines = lines.join("\n");
		data.text = data.text.substr(0, lineStart) + lines + data.text.substr(lineEnd);
		if (data.pos[0] > data.pos[1]) {
			data.pos[1] = lineStart;
			data.pos[0] = lineEnd - len;
		} else {
			data.pos[0] = lineStart;
			data.pos[1] = lineEnd - len;
		}
	}

	function backspace(data) {

		if (selectionRange(data)) {
			del(data);
		} else if (data.pos[0] > 0) {
			data.pos[0]--;
			del(data);
		}
	}

	function unindent(data) {
		if (inMultiLine(data)) {
			multiUnindent(data);
		} else if (!selectionRange(data) && data.text[data.pos[0] - 1] == "\t") {
			backspace(data);
		} else {
			multiUnindent(data);
			home(data);
		}
	}

	function searchFrom(text, re, pos) {
		pos = pos || 0;
		var t = text.substr(pos);
		var s = t.search(re);
		if (s < 0) {
			return -1;
		}
		return s + pos;
	}

	function getTextStart(data, pos) {
		var lineStart = getLineStart(data, pos);
		pos = searchFrom(data.text, /[\S\n]/, lineStart);
		if (pos < 0 || data.text[pos] == "\n") {
			return getLineEnd(data);
		}
		return pos;
	}

	function isTextStart(data) {
		return getTextStart(data) == data.pos[1];
	}

	function home(data) {
		if (isTextStart(data)) {
			data.pos[0] = getLineStart(data);
		} else {
			data.pos[0] = getTextStart(data);
		}
		data.pos[1] = data.pos[0];
	}

	function selectHome(data) {
		var pos = data.pos[0];
		home(data);
		data.pos[0] = pos;
	}

	function getIndents(data) {
		var pos = takeRange(data);
		var lineStart = getLineStart(data, pos[0]);
		var len;

		var textStart = getTextStart(data, pos[0]);
		// console.log(textStart);
		if (textStart >= pos[0]) {
			len = pos[0] - lineStart;
		} else {
			len = textStart - lineStart;
		}
		return data.text.substr(lineStart, len);
	}

	function enter(data) {
		var indents = getIndents(data);
		var range = takeRange(data);
		var p = data.text[range[0] - 1];
		var q = data.text[range[1]];
		insert(data, "\n" + indents);
		if (p == "[" && q == "]" || p == "{" && q == "}") {
			insert(data, "\t\n" + indents);
			data.pos[0] -= indents.length + 1;
			data.pos[1] -= indents.length + 1;
		}
	}

	function brace0(data){
		insert(data, "[]");
		data.pos[0]--;
		data.pos[1]--;
	}

	function brace1(data){
		insert(data, "{}");
		data.pos[0]--;
		data.pos[1]--;
	}

	function init(node, command) {
		var data = {
			text: node.value,
			pos: [node.selectionStart, node.selectionEnd]
		}, t;

		if (node.selectionDirection == "backward") {
			t = data.pos[0];
			data.pos[0] = data.pos[1];
			data.pos[1] = t;
		}

		editor[command](data);

		node.value = data.text;
		if (data.pos[0] > data.pos[1]) {
			node.setSelectionRange(data.pos[1], data.pos[0], "backward");
		} else {
			node.setSelectionRange(data.pos[0], data.pos[1], "forward");
		}
	}

	return init;
}();

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

	// if (area.onkeydown) {
		// area.dataset.textareaPlus = "false";
		// return false;
	// }

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

	var command;

	if (e.keyCode == 9) {
		// tab
		if (e.shiftKey) {
			command = "unindent";
		} else {
			command = "indent";
		}
	} else if (e.keyCode == 13) {
		// enter
		command = "enter";
	} else if (e.keyCode == 36) {
		// home
		if (!e.shiftKey) {
			command = "home";
		} else {
			command = "selectHome";
		}
	} else if (e.keyCode == 219) {
		// braces
		if (!e.shiftKey) {
			command = "brace0";
		} else {
			command = "brace1";
		}
	} else {
		return;
	}

	e.preventDefault();
	e.stopPropagation();

	textareaPlus(e.target, command);
}, true);

GM_addStyle("textarea {tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;}");
