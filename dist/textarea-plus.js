var textareaPlus=function(e){"use strict";function t(e){return!e.getSelection().includes("\n")}function n(e,{indentSize:t}){var n,r=0;for(n=0;n<e.length;n++){var a=e[n];if(" "==a)r++;else{if("\t"!=a)break;r+=t}}return{count:Math.floor(r/t),extraSpaces:r%t,length:n}}function r({indentStyle:e,indentSize:t}){return"TAB"===e?"\t":" ".repeat(t)}function a(e,t,a=1){var s=e.getSelectionRange(),i=e.getSelectionLine(),o=e.getSelectionLineRange();"\n"==i[s.end-o.start-1]&&(o.end=s.end-1,i=i.slice(0,s.end-o.start-1)),i=i.split("\n").map((e=>{if(!e)return e;var s=n(e,t),i=s.count+a;return i<0&&(i=0,s.extraSpaces=0),r(t).repeat(i)+" ".repeat(s.extraSpaces)+e.slice(s.length)})).join("\n"),e.setRangeText(i,o.start,o.end),e.setSelectionRange(o.start,o.start+i.length+1)}const s={__proto__:null,"[":"]","{":"}","(":")"};const i=[{test:e=>"Tab"===e.key&&!e.shiftKey,run:function({editor:e,options:s}){if(t(e)){var i=e.getSelectionLineRange(),o=n(e.getSelectionLine(),s),c=e.getSelectionRange().start;c>i.start+o.length?e.setRangeText(r(s),c,c,"end"):e.setRangeText(r(s).repeat(o.count+1),i.start,i.start+o.length,"end")}else a(e,s)}},{test:e=>"Tab"===e.key&&e.shiftKey,run:function({editor:e,options:s}){if(!t(e))return void a(e,s,-1);var i=e.getSelectionLineRange(),o=e.getSelectionLine(),c=n(o,s),g=e.getCaretPos(!0),l=r(s);const u=c.count+(c.extraSpaces?1:0);g<=i.start+c.length&&u?e.setRangeText(l.repeat(u-1),i.start,i.start+c.length,"end"):o.slice(0,g-i.start).endsWith(l)&&e.setRangeText("",g-l.length,g,"end")}},{test:e=>"Home"===e.key,run:function({editor:e,options:t,event:r}){const a=!r.shiftKey;var s=e.getCurrentLine(),i=e.getCurrentLineRange(),o=e.getCaretPos(a)-i.start,c=n(s,t);o==c.length?e.setCaretPos(i.start,a):e.setCaretPos(i.start+c.length,a)}},{test:e=>"Enter"===e.key,run:function({editor:e,options:t}){var a,i=e.getContent(),o=e.getSelectionRange(),c=e.getSelectionLine(),g=e.getLineRange(o.start,o.start),l=n(c,t),u="\n",d=i[o.start-1],f=i[o.end];/[[{(]/.test(d)?u+=r(t).repeat(l.count+1):u+=c.slice(0,Math.min(l.length,o.start-g.start)),a=o.start+u.length,s[d]&&f==s[d]&&(u+="\n"+c.slice(0,l.length)),e.setRangeText(u),e.setSelectionRange(a,a)}},{test:(e,{completeBraces:t})=>t[e.key],run:function({editor:e,options:t,event:n}){const r=n.key,a=t.completeBraces[r];var s=e.getSelection(),i=e.getSelectionRange();e.setRangeText(r+s+a,i.start,i.end),e.setSelectionRange(i.start+1,i.start+1+s.length)}}],o={indentSize:4,indentStyle:"TAB",completeBraces:{__proto__:null,"[":"]","{":"}","(":")",'"':'"',"'":"'"}};return e.createCommandExecutor=function(e={}){return e=Object.assign({},o,e),{run:function(t,n){for(const r of i)if(r.test(t,e)){t.preventDefault(),r.run({editor:n(),options:e,event:t});break}}}},Object.defineProperty(e,"__esModule",{value:!0}),e}({});
