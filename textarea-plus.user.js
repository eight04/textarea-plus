// ==UserScript==
// @name        Textarea Plus
// @description	An userscript to improve plain textarea for code editing.
// @namespace   eight04.blogspot.com
// @include     http*
// @version     1.0
// @grant       GM_addStyle
// ==/UserScript==

"use strict";

var textareaPlus = function(){

	var editor = {
		indent: indent,
		unindent: unindent,
		home: home,
		selectHome: selectHome,
		enter: enter
	};
	
	function selectionRange(data){
		return data.pos[1] - data.pos[0];
	}
	
	function insert(data, text){
		data.text = data.text.substr(0, data.pos[0]) + text + data.text.substr(data.pos[1]);
		data.pos[0] += text.length;
		data.pos[1] = data.pos[0];
	}
	
	function del(data){
		if (!selectionRange(data)) {
			data.pos[1]++;
		}
		insert(data, "");
	}
	
	function getLineStart(data){
		var pos = data.pos[0];
		if (data.text[pos] == "\n") {
			pos--;
		}
		var s = data.text.lastIndexOf("\n", pos);
		if (s < 0) {
			return 0;
		}
		return s + 1;
	}
	
	function getLineEnd(data){
		var s = data.text.indexOf("\n", data.pos[1]);
		if (s < 0) {
			return data.text.length;
		}
		return s;
	}
	
	function multiIndent(data){
		var lineStart = getLineStart(data), lineEnd = getLineEnd(data);
		var lines = data.text.substr(lineStart, lineEnd - lineStart);
		
		lines = lines.split("\n");
		for (var i = 0; i < lines.length; i++) {
			lines[i] = "\t" + lines[i];
		}
		lines = lines.join("\n");
		data.text = data.text.substr(0, lineStart) + lines + data.text.substr(lineEnd);
		data.pos[0] = lineStart;
		data.pos[1] = lineEnd + i;
	}
	
	function inMultiLine(data) {
		var s = data.text.indexOf("\n", data.pos[0]);
		if (s < 0) {
			return false;
		}
		return  s < data.pos[1];
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
		var lineStart = getLineStart(data), lineEnd = getLineEnd(data);
		var lines = data.text.substr(lineStart, lineEnd - lineStart);
		
		lines = lines.split("\n");
		var len = 0;
		for (var i = 0; i < lines.length; i++) {
			var m = lines[i].match(/^(    | {0,3}\t?)(.*)$/);
			// console.log(m);
			len += m[1].length;
			lines[i] = m[2];
		}
		lines = lines.join("\n");
		data.text = data.text.substr(0, lineStart) + lines + data.text.substr(lineEnd);
		data.pos[0] = lineStart;
		data.pos[1] = lineEnd - len;
	}
	
	function backspace(data) {
		
		if (selectionRange(data)) {
			del(data);
		} else if (data.pos[0] > 0) {
			data.pos[0]--;
			del(data);
		}
	}
	
	function inText(data) {
		return getTextStart(data) <= data.pos[0];
	}
	
	function unindent(data) {
		if (inMultiLine(data)) {
			multiUnindent(data);
		} else if (data.text[data.pos[0] - 1] == "\t") {
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
	
	function getTextStart(data) {
		var lineStart = getLineStart(data);
		var pos = searchFrom(data.text, /[\S\n]/, lineStart);
		if (pos < 0 || data.text[pos] == "\n") {
			return getLineEnd(data);
		}
		return pos;
	}
	
	function isTextStart(data) {
		return getTextStart(data) == data.pos[0];
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
		var pos = data.pos[1];
		home(data);
		if (data.pos[0] > pos) {
			home(data);
		}
		data.pos[1] = pos;
	}
	
	function getIndents(data) {
		var lineStart = getLineStart(data);
		var len;
		
		var textStart = getTextStart(data);
		// console.log(textStart);
		if (textStart >= data.pos[0]) {
			len = data.pos[0] - lineStart;
		} else {
			len = textStart - lineStart;
		}
		return data.text.substr(lineStart, len);
	}
	
	function enter(data) {
		// console.log(data);
		var indents = getIndents(data);
		insert(data, "\n" + indents);
	}
	
	function init(node, command) {
		var data = {
			text: node.value,
			pos: [node.selectionStart, node.selectionEnd]
		};
		
		editor[command](data);
		
		node.value = data.text;
		node.setSelectionRange(data.pos[0], data.pos[1]);
	}
	
	return init;
}();

window.addEventListener("keydown", function(e){
	if (e.target.nodeName != "TEXTAREA") {
		return;
	}
	
	var command;
	
	if (e.keyCode == 9 && !e.ctrlKey && !e.altKey) {
		// tab
		if (e.shiftKey) {
			command = "unindent";
		} else {
			command = "indent";
		}
	} else if (e.keyCode == 13 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
		// enter
		command = "enter";
	} else if (e.keyCode == 36 && !e.ctrlKey && !e.altKey) {
		// home
		if (!e.shiftKey) {
			command = "home";
		} else {
			command = "selectHome";
		}
	} else {
		return;
	}
	
	e.preventDefault();
	textareaPlus(e.target, command);
});

GM_addStyle("textarea {tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;}");
