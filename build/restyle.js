/*! (C) Andrea Giammarchi Mit Style License */
var restyle=function(e){"use strict";function a(e,t){this.node=e,this.css=t}function f(e,t,n){return t+"-"+n.toLowerCase()}function l(e,t,n){var i=[],s=typeof t=="number"?"px":"",o=e.replace(r,f),u;for(u=0;u<n.length;u++)i.push("-",n[u],"-",o,":",t,s,";");return i.push(o,":",t,s,";"),i.join("")}function c(e,t){return e.length?e+"-"+t:t}function h(e,t,r,i){var o,u,a;for(o in r)if(n.call(r,o))if(typeof r[o]=="object")if(s(r[o])){u=r[o];for(a=0;a<u.length;a++)e.push(l(c(t,o),u[a],i))}else h(e,c(t,o),r[o],i);else e.push(l(c(t,o),r[o],i));return e.join("")}function p(e,t){var r=[],s,u,a,f,l,c,d;for(f in e)if(n.call(e,f)){s=f.charAt(0)==="@"&&!i.test(f),u=s?f.slice(1):f,l=o.concat(e[f]);for(c=0;c<l.length;c++){a=l[c];if(s){d=t.length;while(d--)r.push("@-",t[d],"-",u,"{",p(a,[t[d]]),"}");r.push(f,"{",p(a,t),"}")}else r.push(f,"{",h([],"",a,t),"}")}}return r.join("")}var t=e.toString,n=e.hasOwnProperty,r=/([a-z])([A-Z])/g,i=/^@(?:page|font-face)/,s=Array.isArray||function(e){return t.call(e)==="[object Array]"},o=[],u;return a.prototype={remove:function(){var e=this.node,t=e.parentNode;t&&t.removeChild(e)},valueOf:function(){return this.css}},{"undefined":!0}[typeof document]?(u=function(e,t){return p(e,t||o)},u.restyle=u):u=function(e,t,n){var r=n||document,i=p(e,t||u.prefixes),s=r.head||r.getElementsByTagName("head")[0]||r.documentElement,o=s.insertBefore(r.createElement("style"),s.lastChild);return o.type="text/css",o.styleSheet?o.styleSheet.cssText=i:o.appendChild(r.createTextNode(i)),new a(o,i)},u.prefixes=["webkit","moz","ms","o"],u}({});