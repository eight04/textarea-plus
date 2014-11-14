Textarea Plus
=============
Have a better textarea! An userscript to improve plain textarea for code editing.

Features
--------
* Tab in textarea.
* Auto indent (notepad++ style).
* Multi-line indent/unindent.
* Smart home key.

Demo
----
<https://rawgit.com/eight04/textarea-plus/master/demo.html>

Todos
-----
* Auto close braces.

Changelog
---------
* 1.1
	- Fix direction issue when using Shift + Home/End.
	- Changed how data.pos works. `pos[0]` will greater than `pos[1]` if direction is "backward".
* 1.0.4
	- ignore if element has onkeydown attr.
* 1.0.3
	- add ignore class list.
* 1.0
	- first release.
