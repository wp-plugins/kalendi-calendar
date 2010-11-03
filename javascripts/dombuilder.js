var isIE = navigator.userAgent.match(/MSIE/)
DomBuilder = {
  IE_TRANSLATIONS : {
    'class' : 'className',
    'for' : 'htmlFor'
  },
  ieAttrSet : function(a, i, el) {
    var trans;
    if (trans = this.IE_TRANSLATIONS[i]) el[trans] = a[i];
    else if (i == 'style') el.style.cssText = a[i];
    else if (i.match(/^on/)) el[i] = typeof a[i] == "function" ? a[i] : new Function(a[i]);
    else el.setAttribute(i, a[i]);
  },
	apply : function(o) { 
	  o = o || {};
		var els = ("p|div|span|strong|em|img|table|tr|td|th|thead|tbody|tfoot|pre|code|" + 
					   "h1|h2|h3|h4|h5|h6|ul|ol|li|form|input|textarea|legend|fieldset|" + 
					   "select|option|blockquote|cite|br|nobr|hr|dd|dl|dt|address|a|button|abbr|acronym|b|" +
					   "script|link|style|bdo|ins|del|object|param|col|colgroup|optgroup|caption|big|small|" + 
					   "label|dfn|kbd|samp|var").split("|");
    var el, i=0;
		while (el = els[i++]) o[el.toUpperCase()] = DomBuilder.tagFunc(el);
		return o;
	},
	tagFunc : function(tag) {
	  return function() {
	    var a = arguments, at, ch; a.slice = [].slice; if (a.length>0) { 
	    if (a[0].nodeName || typeof a[0] == "string") ch = a; 
	    else { at = a[0]; ch = a.slice(1); } }
	    return DomBuilder.elem(tag, at, ch);
	  }
  },
	elem : function(e, a, c) {
		a = a || {}; c = c || [];
		var el = document.createElement((isIE && a.name)?"<" + e + " name=" + a.name + ">":e);
		for (var i in a) {
		  if (typeof a[i] != 'function') {
		    if (isIE) this.ieAttrSet(a, i, el);
		    else el.setAttribute(i, a[i]);
		  }
	  }
		for (var i=0; i<c.length; i++) {
			if (typeof c[i] == 'string') c[i] = document.createTextNode(c[i]);
			el.appendChild(c[i]);
		} 
		return el;
	}
}