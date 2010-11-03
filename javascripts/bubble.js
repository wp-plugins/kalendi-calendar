DomBuilder.apply(this)

function hide(objName) {
	var theObj = document.getElementById(objName)
	if (theObj) theObj.style.visibility = "hidden"
}

function getInsideWindowWidth( ) {
    if (window.innerWidth) {
        return window.innerWidth
    } else if (document.compatMode && document.compatMode.indexOf("CSS1") >= 0) {
        // measure the html element's clientWidth
        return document.body.parentElement.clientWidth
    } else if (document.body && document.body.clientWidth) {
        return document.body.clientWidth
    }
    return 0
}

function getObjectWidth(obj)  {
    var elem = typeof(obj) == "string" ? document.getElementById(obj) : obj
    var result = 0
    if (elem.offsetWidth) {
        result = elem.offsetWidth
    } else if (elem.clip && elem.clip.width) {
        result = elem.clip.width
    } else if (elem.style && elem.style.pixelWidth) {
        result = elem.style.pixelWidth
    }
    return parseInt(result)
}

function getObjectHeight(obj)  {
    var elem = typeof(obj) == "string" ? document.getElementById(obj) : obj
    if (!elem) return 0
    var result = 0
    if (elem.offsetHeight) {
        result = elem.offsetHeight
    } else if (elem.clip && elem.clip.height) {
        result = elem.clip.height
    } else if (elem.style && elem.style.pixelHeight) {
        result = elem.style.pixelHeight
    }
    return parseInt(result)
}

function showAbsolute (objName,x,y) {
	var theObj = document.getElementById(objName).style
	theObj.left = x + "px"
	theObj.top = y + "px"
	theObj.visibility = 'visible'
}

function populateBubble(div,text) {
 hide('bubble'); hide('arrowmouth')
 var bubble = document.getElementById('bubble')
 bubble.style.width = "300px"
 var divObj = document.getElementById(div)
 divObj.innerHTML = divObj.text
 var width = getObjectWidth(divObj.firstChild)
 if (width > 300) bubble.style.width = width
}

// Timeout of 0 means bubble pops up immediately. This should be used when the bubble is being invoked with an
// onclick event. If using the bubble with onmouseover events, leave out the timeout argument or set it to a non-zero 
// value. Also in this case, call cancelInfo() in an onmouseout over the bubble creating objects.
function displayInfo(info,ev,timeout) {
  if (!document.getElementById("bubble")) initBubble()
  if (timeout == null) timeout = 500
  //if (!loaded) return
  if (!info || info == '') { hide('bubble'); hide("arrowmouth"); return }
  if (!ev) ev = window.event
  var x = ev.clientX
  var y = ev.clientY
  stop(ev)
  document.getElementById("bubbleText").text = '<table class="noborder"><tr><td width="5">&nbsp;</td><td>' + info + '</td></tr></table>'
  if (document.all) {
    x += document.body.scrollLeft
    y += document.body.scrollTop
    ev.cancelBubble = true
  } else if (document.getElementById) {
    x += scrollX
    y += scrollY
  }
  if (timeout != 0)
    document.getElementById("bubble").timeoutID = setTimeout("populateBubble('bubbleText'); showBubble('bubble','arrowmouth',"+x+","+y+"); document.getElementById('bubble').timeoutID = false;",500)
  else { populateBubble("bubbleText"); showBubble("bubble","arrowmouth",x,y) }
}

function cancelInfo() {
  //if (!loaded) return
  var divObj = document.getElementById("bubble")
  if (divObj && divObj.timeoutID) {
    clearTimeout(divObj.timeoutID)
    divObj.timeoutID = false
  }
}

function hideInfo() {
	cancelInfo()
	hide("bubble")
	hide("arrowmouth")
}

  function Round(obj,bk,color){
    var elem = document.getElementById(obj)
    if (elem.firstChild.className == "rtop") return
    AddTop(elem,bk,color)
    AddBottom(elem,bk,color)
  }

function AddTop(el,bk,color){
  var i
  var d=document.createElement("b")
  var cn="r"
  var lim=4
  d.className="rtop"
  d.style.backgroundColor=bk
  for(i=1;i<=lim;i++){
    var x=document.createElement("b")
    x.className=cn + i
    x.style.backgroundColor=color
    d.appendChild(x)
  }
  el.insertBefore(d,el.firstChild)
}

function AddBottom(el,bk,color){
  var i
  var d=document.createElement("b")
  var cn="r"
  var lim=4
  d.className="rbottom"
  d.style.backgroundColor = bk
  for(i=lim;i>0;i--){
    var x=document.createElement("b")
    x.className=cn + i
    x.style.backgroundColor=color
    d.appendChild(x)
  }
  el.appendChild(d,el.firstChild)
}

function showBubble(div,span,x,y) {
  Round(div,"#FFFFFF","#FFCCCC")
  document.getElementById(div).style.visibility = "visible"
  var divWidth = getObjectWidth(div)
  var divHeight = getObjectHeight(div)
  var shiftLMax = divWidth / 2 -45
  var shiftRMax = shiftLMax - 10
  var divX = x - (divWidth-95)/2
  var divY = y-69-divHeight
  var spanX = x
  var spanY = y-95
  var overHang = divX + divWidth - getInsideWindowWidth() + 20
  if (overHang > 0) {
     divX -= Math.min(overHang,shiftRMax)
  } else if (divX < 0) divX += Math.min(-divX,shiftLMax)
  if ((document.all && divY < 100) || (!document.all && divY < 0)) {
    spanY += 95; divY = y + 71; document.getElementById('arrowimg').src = "http://www.kalendi.com/ruben/bubbles/images/arrowmouth3.gif"
  } else document.getElementById('arrowimg').src = "http://www.kalendi.com/ruben/bubbles/images/arrowmouth2.gif"
  showAbsolute(div,divX,divY)
  showAbsolute(span,spanX,spanY)
}

function initBubble() {
	if (!(document.getElementById("bubble"))) {
		document.body.insertBefore(DIV({id : "bubble", style : "visibility:hidden;position:absolute;width:300;z-index:1000"},
			P({"class" : "bubintl", style: "float:right"},IMG({src : "http://www.kalendi.com/ruben/bubbles/images/close.gif", onclick : "hide('bubble'); hide('arrowmouth')"})),
			P({id : "bubbleText", width : "90%", style : "clear:right"},"some text")),document.body.firstChild)
		document.body.insertBefore(DIV({id : "arrowmouth", style : "visibility:hidden;position:absolute;z-index:900"},IMG({id : "arrowimg", src : "http://www.kalendi.com/ruben/bubbles/images/arrowmouth2.gif"})),document.body.firstChild)
		document.body.insertBefore(IMG({style : "display:none", src : "http://www.kalendi.com/ruben/bubbles/images/arrowmouth3.gif"}),document.body.firstChild)
	} 
}
