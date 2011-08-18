var isSafari = (navigator.appVersion.indexOf('Safari') == -1 ? false : true);

function PrintControl (tagID,widget) {
  this.domNode = document.getElementById(tagID)
  this.domNode.onclick = function (w) { return function (event) { w.print(event) }}(this)
  this.print = function (evt) {
    var events = widget.getSelectedElsText()
	if (!events|| all(events,function (n) {return _hasClass(n,"cal_day_heading")})) alert('No events are selected')
	else {
		var win = window.open("","","resizable=yes,status=no,menubar=no,top=0,width=600,height=600",true)
 		if (isSafari) win.document.writeln("<html><head><title>Print events</title></head><body></body></html>")
		var link = win.document.createElement("LINK")
		link.rel = "stylesheet"
		link.type = "text/css"
		var port = document.location.port;
		//var host = document.location.protocol + "//" + document.domain + (port ? ':' + port : '') + "/"
		var host = "http://www.kalendi.com/"		
		link.href = host + "kalendi/portal/printlist.css"
		win.document.getElementsByTagName("head")[0].appendChild(link)
 	    if (this.domNode.getAttribute("imgFile")) win.document.body.innerHTML += '<div style="margin-bottom:10px"><img src="' + this.domNode.getAttribute("imgFile") + '"></div>'
 		map.call(this,events, function (n) {
			win.document.body.innerHTML += '<div class="' + n.getAttribute("class") + '">' + n.innerHTML + "</div><br>"
			if (n.elementID && !n.expanded && n.printExpander) n.printExpander(win.document.body)
 		})
	    mapDOM(win.document.body,function (n) { if (n.nodeName == "A") n.parentNode.replaceChild(win.document.createTextNode(n.href),n)})
		if (document.all || isSafari) {
		  win.document.body.innerHTML += '<input class="noprint" type="button" value="Click to print" onclick="window.print()">'
	    } else {
	        var script = win.document.createElement("SCRIPT")
	        script.innerHTML = "window.print()"
    		win.document.getElementsByTagName("head")[0].appendChild(script)
	    }
	}
  }
}

function mkPrintDescr (desc,doc) {
    var pars = desc.split("<br>")
    if (pars.length == 1) {
      var span = doc.createElement("SPAN")
      span.innerHTML = desc
      return span
    } else {
		var span = doc.createElement("SPAN")
		for (var i=0;i<pars.length;i++) {
		  span.appendChild(doc.createTextNode(pars[i]))
		  span.appendChild(BR())
		}
    }
    return span
  }
