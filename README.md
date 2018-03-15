Textarea Plus
=============
Have a better textarea! An userscript to improve plain textarea for code editing.

Features
--------
* Tab in textarea.
* Auto indent (notepad++ style).
* Auto close braces.
* Multi-line indent/unindent.
* Smart home key.

Install
-------
<https://greasyfork.org/scripts/4949-textarea-plus>

Demo
----
<https://rawgit.com/eight04/textarea-plus/master/demo.html>

Changelog
---------
* 3.0.0 (Mar 16, 2018)
  - Add test. Pull out the core part.
  - Fix: keep extra spaces when indent/unindent. (#3)
* 2.0.2 (Mar 16, 2017)
	- Fix new line indent bug.
* 2.0.1 (Jan 29, 2017)
	- Fix smart home bug.
* 2.0.0 (Jan 28, 2017)
	- Rewrite.
	- Change the behavior of braces when selection is not empty.
* 1.1.2 (Jun 18, 2015)
	- Do not use capture flag.
* 1.1.1 (Dec 9, 2014)
	- Auto close braces.
* 1.1.0
	- Fix direction issue when using Shift + Home/End.
	- Changed how data.pos works. `pos[0]` will greater than `pos[1]` if direction is "backward".
* 1.0.4
	- ignore if element has onkeydown attr.
* 1.0.3
	- add ignore class list.
* 1.0
	- first release.
