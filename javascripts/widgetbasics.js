var isIE = navigator.userAgent.match(/MSIE/)
var host = "http://hj2.happyjacksoftware.com/"
var port = document.location.port;
//var host = document.location.protocol + "//" + document.domain + (port ? ':' + port : '') + "/"

function require(URL,doc) {
  if (!doc) doc = document
  var scripts = document.getElementsByTagName("script")
  for (var i=0;i<scripts.length;i++)
    if (scripts[i].src == URL) return
  var head = doc.getElementsByTagName('head').item(0)
  	var script = doc.createElement('script')
	script.src = URL
	script.type = 'text/javascript'
	//script.defer = true
	void(head.appendChild(script))
}

function loadStyleSheet(URL) {
  if (!URL) return
  if (URL.indexOf("http:") == -1) {
	  var path = window.location.href.split("/")
	  path.splice(path.length-1,1)
	  URL = path.join("/") + "/" + URL
  }
  var head = document.getElementsByTagName('head').item(0)
  var links = document.getElementsByTagName("link")
  for (var i=0;i<links.length;i++)
    if (links[i].href == URL) return
  var link = document.createElement("link")
  link.rel = "stylesheet"
  link.type = "text/css"
  link.href = URL
  void(head.appendChild(link))
}

function map(ar,fn) {
  if (ar != null)
    for (var i=0;i<ar.length;i++) fn.call(this,ar[i])
}

function mapDOM(node,fn) {
	fn(node)
	for (var i=0;i<node.childNodes.length;i++) mapDOM(node.childNodes[i],fn)
}

function _hasClass(el, className) {
	var re = new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)');
    return re.test(el['className']);
}


 function addClass(el, className) {
    if (_hasClass(el, className)) { return; }
    el['className'] = [el['className'], className].join(' ')
}
   
function removeClass(el, className) {
   var re = new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)', 'g');
   if (!_hasClass(el, className)) { return; } // not present
   var c = el['className'];
   el['className'] = c.replace(re, ' ');
}

function remIf(ar,fn) {
  if (ar == null) return
  for (i=0;i<ar.length;i++)
    if (fn(ar[i])) {
      ar.splice(i,1)
      return
    }
}

function stop(evt) {
  evt = evt || event
  if (evt.stopPropagation) evt.stopPropagation()
  else evt.cancelBubble = true
}

function mkDescr (desc) {
    var pars = desc.split("<br>")
    if (pars.length == 1) return SPAN(desc)
    else {
		var span = SPAN()
		for (var i=0;i<pars.length;i++) {
		  span.appendChild(document.createTextNode(pars[i]))
		  span.appendChild(BR())
		}
    }
    return span
  }
  
 
function activateONCR(evt,fn,str) {
  if (evt.keyCode == 13) {
    fn(str,evt);
  }
}

function all (ar,fn) {
  for (var i=0;i<ar.length;i++) if (!fn(ar[i])) return false
  return true
}
  
function checkStyle (re) {
		var rulesAttr = "cssRules"
		var textAttr = "cssText"
		if (document.all) {
			rulesAttr = "rules"
			textAttr = "selectorText"
		}
	
		for (i = 0; i < document.styleSheets.length; i++) 
			try {
				var rules = document.styleSheets[i][rulesAttr]
				for (j = 0; j < rules.length; j++) {
					var text = rules[j][textAttr];
					if (text.match(re))
						return true
				}
			} catch (e) {
				continue
			}
			
		return false
} 


function showAbsolute (objName,x,y) {
	var theObj = document.getElementById(objName).style
	theObj.left = x + "px"
	theObj.top = y + "px"
	theObj.visibility = 'visible'
}

function displayToolTip(text,ev) {
  var div = 'tooltip';
  var x = ev.clientX;
  var y = ev.clientY;
	var tooltipHeight, tooltipWidth
  if (ev.cancelBubble) return;
  var tooltip = document.getElementById(div);    
  if (tooltip.style.visibility == "visible") {
     hideToolTip(); return
  }
	tooltip.innerHTML = '<table id="divTable" width="100%" onclick="hideToolTip(event)"><tr><td align="right"><div class="tooltip_close"></div></td></tr><tr><td class="tooltip_text" ' + (document.all ? 'nowrap="nowrap"' : '') + '>' + text + '</td></tr></table>';
	tooltipWidth = tooltip.offsetWidth;
  tooltipHeight = tooltip.offsetHeight;	
	tooltip.firstChild.onclick = ev.target.onclick;
	if (!isSafari) {
		x += scrollX;
		y += scrollY;
	}
	ev.stopPropagation();  
	y -=5;
  x += 10;
  var diff = this.document.body.clientWidth - x;
  if (tooltipWidth >= 0) {
  		if (x - 10 > diff) //see i there is more room to the left
  			x -= tooltipWidth + 10; //try to keep it on the screen
  }
  if (tooltipHeight + y >= this.document.body.clientHeight)
  		y -= tooltipHeight;  
  showAbsolute(div,x,y)
}

function hideToolTip() {
  var div = "tooltip"
  if (document.layers && document.layers[div])
    document.layers[div].visibility = 'hidden';
  else if (document.all && document.all[div]) document.all[div].style.visibility = 'hidden';
  else if (document.getElementById && document.getElementById(div)) 
  	document.getElementById(div).style.visibility = 'hidden';
}

function setupToolTip () {
	var tt = document.getElementById("tooltip")
	if (tt) return
	tt = SPAN({id: "tooltip", "class": "tooltip", style: "position: absolute; visibility: hidden; z-index: 2000;width:270px"})
	var body = window.document.getElementsByTagName('body').item(0)
	body.insertBefore(tt,body.firstChild)
}


function openDirections (from, to) {
  	var mapit = window.open("http://www.kalendi.com/mapit/Directions.html?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to), "CALibrate_Directions", "location=no,status=no,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,width=650,height=450,top=0,left=0,",true)
	  mapit.focus();
}


function setupDirections(x, y, height, width, loc) {
  var ifr = DIV({id: "directions", style: "position:absolute;display:none;z-index:899"})
  var body = window.document.getElementsByTagName('body').item(0)
  body.insertBefore(ifr,body.firstChild)
  ifr.innerHTML = '<form id="directionsForm" name="directionsForm" onsubmit="return false"><input type="hidden" name="to" value="' + loc + '"><table cellpadding="0" cellspacing="0" border="0" width="' +  width + 'px" height="' + height + 'px" class="directions_main"><tr><td width="50">&nbsp;</td><td valign="middle"><table width="325" border="0" cellpadding="2" cellspacing="0">' +  				  
  				  '<tr><td class="directions_bold_text">&nbsp;&nbsp;From:</td><td width="273" style="text-align:right"><input type="text" name="from" size="35" value="" tabindex="1"><b><font size="-2" face="Verdana, Arial" color="#444444"></font></b></td>' +
  				  '</tr><tr><td class="directions_bold_text" style="text-align:right" colspan="2" onmouseover="this.style.cursor=hand"><span tabindex="2" onclick="hideToolTip();openDirections(document.forms.namedItem(\'directionsForm\').elements.namedItem(\'from\').value,document.forms.namedItem(\'directionsForm\').elements.namedItem(\'to\').value); document.getElementById(\'directions\').style.display=\'none\'" onkeydown="this.onclick.call(this, event);">MapIt!</span><span onclick="displayToolTip(\'For best results enter the street<BR>address and city from which you<BR>will be travelling.  You do not<BR>have to know your exact street<BR>number, just an approximation<BR>will do.<br><br><b>Examples</b><br>1900 Harney Street, Laramie<br>6700 Hollywood Blvd, Hollywood, CA<br> \',event)" class="helpOuter"><img src="http://www.kalendi.com/new_widgets/common/images/spacer.gif" class="helpIcon"></div></span></td>' +
  				  '</tr></table></td><td valign="top" class="directions_close" onclick="hideToolTip();document.getElementById(\'directions\').style.display=\'none\'"><div class="directions_close_Icon"></div></td></tr></table></form>'
  return ifr
}


function getElementPosition(obj) {
    var offsetTrail = typeof obj == "string" ? document.getElementById(obj) : obj;
    var offsetLeft = 0;
    var offsetTop = 0;
    while (offsetTrail) {
        offsetLeft += offsetTrail.offsetLeft;
        offsetTop += offsetTrail.offsetTop;
        offsetTrail = offsetTrail.offsetParent;
    }
    if (navigator.userAgent.indexOf("Mac") != -1 && 
        typeof document.body.leftMargin != "undefined") {
        offsetLeft += parseInt(document.body.leftMargin);
        offsetTop += parseInt(document.body.topMargin);
    }
    return {left:offsetLeft, top:offsetTop};
}


function getDirections(e, loc) {
	if (!e) e = window.event
	var height = 100
	pos = document.all ?  getElementPosition(e.srcElement) : getElementPosition(e.target) 
  var x = pos.left//e.pageX
  var y = pos.top - Math.round(height/2) //e.pageY - Math.round(height/2)
  var helpWidth = 200
  var l = document.getElementById("directions")
  if (!l) {
  	l = setupDirections(x, y, height, helpWidth, loc)
  	setupToolTip()
  }
  else { document.getElementById("directionsForm").elements.namedItem("to").value = loc;  }
  l.style.top = y + "px"
  l.style.left = x + "px"
  l.style.display = "block"
  document.getElementById("directionsForm").elements.namedItem("from").focus()
}
 
