// ==UserScript==
// @name        Textarea Plus
// @description	An userscript to improve plain textarea for code editing
// @namespace   eight04.blogspot.com
// @include     http*
// @version     0.1
// @grant       GM_addStyle
// ==/UserScript==

"use strict";

var textareaPlus = function(){
	var area = null;
	
	function indent() {
		if (area.selectionStart == area.selectionEnd) {
			var pos = area.selectionStart;
			var text = area.value;
			if (inText(text, pos)) {
				area.value = text.substr(0, pos) + "\t" + text.substr(pos);
				area.setSelectionRange(pos + 1, pos + 1);
			} else {
				
			}
		}
	}
	
	var commands = {
		indent: indent,
		unindent: unindent,
		home: home,
		enter: enter
	};
	
	function init(node, command) {
		area = node;
		commands[command]();
	}
	
	return init;
}();

window.addEventListener("keydown", function(e){
	if (e.target.nodeName != "TEXTAREA") {
		return;
	}
	
	var editor, command = null;
	
	switch (e.keyCode) {
		case 9:
			if (e.shiftKey) {
				command = "unindent";
			} else {
				command = "indent";
			}
			break;

		case 13:
			command = "enter";
			break;
			
		case 36:
			command = "home";
			break;
			
		default:
			return;
	}
	
	e.preventDefault();
	textareaPlus(e.target, command);
});

GM_addStyle("textarea {tab-size: 4; -moz-tab-size: 4; -o-tab-size: 4;}");
