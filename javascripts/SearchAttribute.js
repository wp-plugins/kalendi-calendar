function SearchAttribute(searchText,searchButton, widget) {
	var port = document.location.port;
	//var host = document.location.protocol + "//" + document.domain + (port ? ':' + port : '') + "/"
	var host = "http://hj2.happyjacksoftware.com/"
  //loadStyleSheet("common/adsrch.css")
  loadStyleSheet("http://www.kalendi.com/new_widgets/common/adsrch.css")
  this.searchText = document.getElementById(searchText)
  this.searchButton = document.getElementById(searchButton)
  this.widget = widget
  this.click = function (text) { this.searchString = text}
  require(host + "kalendi/portal/drag.js")
  require(host + "kalendi/calendar1.js")
  //require("advancedsearch.js")
  var ifr = DIV({id: "_srchResults", style: "width:600px;height:400px;position:absolute; top:200px; left:70px;display:none;background:transparent;z-index:1000"})
  var body = window.document.getElementsByTagName('body').item(0)
  body.insertBefore(ifr,body.firstChild)
  
  this.doSearch = function (widget,searchString,searchAnd,searchExact) {
    var dt = new Date()
    dt.setFullYear(dt.getFullYear() + 1)
    this.doAdvancedSearch(widget,new Date(),dt,widget.cals,searchString)
  }
  
  this.doAdvancedSearch = function(widget,startDT,endDT,cals,searchString,searchAnd,searchExact) {
    this.apiHandler = new CalibrateAPI(widget.URL, widget)
    this.apiHandler.renderer = this
    this.apiHandler.getEvents (widget.username, widget.password, 
                               widget.zoneID, cals, 
                               startDT,endDT,searchString,searchAnd,searchExact)
  }
  
  this.initializeRendering = function () {
  }

  this.doRendering = function(handler) {
    var body = document.getElementById("_srchResults")
    body.innerHTML = ""
    body.appendChild(DIV({"class": "calborder title",align:"center"},H3("Search Results")))
    var inner
    body.appendChild(TABLE({"class": "calborder",width:"100%","cellSpacing":"1","cellPadding":"4",border:"0"},inner = TBODY()))
    for (var i=0;i<handler.eventInfo.length;i++) {
      var info = handler.eventInfo[i]
      inner.appendChild(TR({align: "left",valign:"top"},
      					 TD({width: "120", nowrap: "nowrap","bgColor": i%2==1? "#EEEEEE" : "white"},info.date.substr(5),BR(),
      					 		info.stTime ? info.stTime + "-" + info.endTime : ""),
      					 TD({"bgColor": i%2 == 1 ? "#EEEEEE" : "white"},info.caption,BR(),info.calendarName)))
    }
    if(handler.eventInfo.length == 0){
    inner.appendChild(TR({align: "left",valign:"top"},
      					 TD({width: "120", nowrap: "nowrap","bgColor": i%2==1? "#EEEEEE" : "white"},"Item not found",BR())))

    }
    var button
    inner.appendChild(TR(TD({"colSpan":"2", align:"center"},button = INPUT({type: "button",value: "done"}))))
    button.onclick = function () { document.getElementById("_srchResults").style.display = "none" }
    body.style.display = "block"
  }
  
  this.setAdvancedSearch = function(id) {
	 document.getElementById(id).onclick = 
	 	function (widget) { return function (evt) {advancedSearch(widget,evt) }}(this)
  }
  
  this.searchText.onkeyup = function (widget) { 
  	return function (event) { 
  		var elem = (event.target) ? event.target : event.srcElement; 
  		if (elem) activateONCR(event,function (val) {widget.doSearch(widget.widget,val)},elem.value)}}(this)
  this.searchButton.onclick =  function (widget) {
  		return function (evt) { widget.doSearch(widget.widget,widget.searchText.value) }}(this)
}

function setupAS (widget) {
  var ifr = DIV({id: "_adsrch", style: "width:600px;height:400px;position:absolute;display:none;background:white;z-index:1000"})
  var body = window.document.getElementsByTagName('body').item(0)
  body.insertBefore(ifr,body.firstChild)
  ifr.innerHTML ='<div id="content" class="calborder"><div class="navback title" style="border-bottom:1px #A1A5A9 solid" onmousedown="dragger.allowDrag(this.parentNode.parentNode, event)" ondragstart="return false" ondrag="return false" ondragend="return false"><h1>Advanced Search</h1></div> <div style="font-family: Helvetica, sans-serif; font-size: 12px;"><br><b>&nbsp;Find events that:</b></div>' +
                 '<form name="adsearch" onReset="resetOptions()"><table width="100%"><tr><td nowrap="nowrap">Contain some of these words</td><td><input type="text" id="searchString" name="searchString" style="width:300px;height:20px"></td></tr>	<tr><td colspan="2" align="center">OR</td></tr>   <tr><td nowrap="nowrap">Contain all these words</td><td><input type="text" id="searchAll" name="searchAll" style="width:300px;height:20px"></td></tr>' +
                 '<tr><td colspan="2" align="center">OR</td></tr>	<tr><td nowrap="nowrap">Contain this exact phrase</td><td><input type="text" id="searchExact" name="searchExact" style="width:300px;height:20px"></td></tr>	<tr><td width="100%" colspan="2" style="border-bottom:1px #A1A5A9 solid">&nbsp;</td></tr>	<tr><td colspan="2">&nbsp;</td></tr>' +
  				 '<tr><td nowrap="nowrap">Occur between these dates</td><td><input id="start" name="startDT" value="" width="13" maxlength="11" style="width:80px;height:20px">&nbsp;<a onclick="javascript:cal1.popup(event);"><img src="http://www.kalendi.com/kalendi/images/calendar_icon.gif" align="top" border="0"></a>&nbsp;&nbsp;-&nbsp;&nbsp;			<input id="end" name="endDT" value="" width="13" maxlength="11" style="width:80px;height:20px">&nbsp;<a onclick="javascript:cal1a.popup(event);"><img src="http://www.kalendi.com/kalendi/images/calendar_icon.gif" align="top" border="0"></a></td></tr>' +
  				 '<tr><td width="100%" colspan="2" style="border-bottom:1px #A1A5A9 solid">&nbsp;</td></tr>	<tr><td colspan="2">&nbsp;</td></tr>	<tr><td>Are on these calendars</td><td><select id="cals" name="cals" style="width:200px" multiple size="10">' +
				 makeOptions(widget.widget.cals) +
  				 '</select><br>(Use c-click to make multiple selections.)</td></tr>' +
  				 '<tr><td width="100%" colspan="2" style="border-bottom:1px #A1A5A9 solid">&nbsp;</td></tr>	<tr><td colspan="2">&nbsp;</td></tr>	<tr><td colspan="2" align="center"><input id="ASsubmit" type="button" value="submit">&nbsp;<input type="reset" value="reset">&nbsp;<input type="button" value="cancel" onclick="document.getElementById(\'_adsrch\').style.display=\'none\'"></td></tr>' +
  				 ' </table> </form> </div>'
  initMiniCals()
  document.getElementById("ASsubmit").onclick = 
  	function (widget) { return function (evt) { 
  	  if (formOK()) {
  	    widget.doAdvancedSearch(widget,cal_prs_date1(document.getElementById("start").value),cal_prs_date1(document.getElementById("end").value),getOptionValues(document.getElementById("cals")),document.getElementById("searchString").value,document.getElementById("searchAll").value,document.getElementById("searchExact").value)
  	    document.getElementById('_adsrch').style.display='none' 
  	  }
  	}}(widget)
  loadStyleSheet("http://www.kalendi.com/new_widgets/common/adsrch.css")
  //addCatOptions(catSelector)
  return ifr
}

function makeOptions(opts) {
  var result = ""
  for (var i=0;i<opts.length;i++) {
  	var ar = opts[i].split('/')
  	result += '<option value="' + opts[i] + '" selected>' + ar[ar.length-1] + '</option>'
  }
  return result
}

function advancedSearch(widget,evt) {
  var obj = document.getElementById("_adsrch")
  if (!obj) obj = setupAS(widget)
  obj.style.left = "10px"
  obj.style.top = ((document.all ? document.documentElement.scrollTop : scrollY) + 10) + "px"
  obj.style.display = "block"
}

function initMiniCals(doc) { 
  doc = doc || document
  var start = doc.getElementById("start");
  var dt = new Date()
  cal1 = new calendar1(start); start.value = start.defaultValue = cal_gen_date1(dt)
  cal1.year_scroll = true; cal1.time_comp = false 
  var end = doc.getElementById("end")
  dt.setMonth(dt.getMonth() + 1)
  cal1a = new calendar1(end); end.value = end.defaultValue = cal_gen_date1(dt)
  cal1a.year_scroll = true; cal1a.time_comp = false
}
function formOK () {
	var count = 0
	if (document.getElementById("searchString").value != '') count ++
	if (document.getElementById("searchAll").value != '') count++
	if (document.getElementById("searchExact").value != '') count++
	if (count > 1) {
	  alert("At most one of the search text fields can be non empty")
	  return false
	}
	var startDay = cal_prs_date1(document.getElementById('start').value);
	if (!startDay) return false;
	var endDay = cal_prs_date1(document.getElementById('end').value);
	if (!endDay) return false;
	if (endDay < startDay) {
	  alert("The end day of the search interval cannot preceed the start day")
	  return false
	}
	var calsOK = false
	var select = document.getElementById('cals')
	for (var i=0;i<select.options.length;i++)
	  if (select.options[i].selected) {
	  	calsOK = true; break
	  }
	if (!calsOK) {
		alert("'all' or at least one category must be selected")
		return false
	}
	return true
}

function getOptionValues(select) {
 var vals = "";		
 var optionEls = select.options;
 for (var j=0; j<optionEls.length; j++) {
   if (optionEls[j].selected && optionEls[j].value != "") vals += (vals == "" ? "" : ",") + optionEls[j].value;
 }
 return vals
}
