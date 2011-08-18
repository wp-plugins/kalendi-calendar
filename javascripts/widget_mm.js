var global = this
var hand = (document.all ? 'hand' : 'pointer')
DomBuilder.apply(global)
var instanceCount = 1;

var onmouseoverFn = new Function ("this.style.cursor=hand")

function CalibrateMonthWidget (month_id, details_id, console_id,URL) {
    if (!this instanceof CalibrateMonthWidget) {
        return new CalibrateMonthWidget ();
    }
    
    var host = "http://hj2.happyjacksoftware.com/"
		var port = document.location.port;
		//host = document.location.protocol + "//" + document.domain + (port ? ':' + port : '') + "/"
		var btn_right_small_defined = checkStyle(/^\.btn_right_small/)
		var today = new Date()
		this.instanceID = instanceCount++;
    this.URL = URL
    this.monthID    = month_id;
    this.detailsID  = details_id;
    this.consoleID  = console_id;
    this.apiHandler = null;
    this.key        = null;
    this.eventMap   = {}
    this.eventRows  = null;
    this.detailsHeading = null;
    this.displayTimeInColumnP = false;
    this.todayTd = null;
    this.displayDayTd = null;
    this.selectedEls = []
    this.showCaption = true
    this.mode = "day"
    this.year = today.getFullYear()
    this.month = today.getMonth()
    this.day = today.getDate()
    this.week = new Date()
    this.week.setDate(this.week.getDate() - this.week.getDay())
    
    this.knownEvents = {"caption": true, "description": true, "calendarName": true,"visibility": true, "date": true, "stTime": true, "endTime": true, "recurring": true,
						"refurl": true, "allDay": true, "location": true, "endDate": true}
	
	this.setDetails = function (type) {
	  this.details = type
	  if (type == "bubble") initBubble()
	}

    this.anyDetails = function(info) {
	  if (info.description || info.location) return true
	  for (var i in info) if (!this.knownEvents[i] && typeof(info[i]) == "string") 
				return true
	  return false
    }

  this.mkDescr = function(desc) {
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
	
    this.makeInfo = function(event) {
      var result = "";
      result += "<table>";
      result += "<tr><th colspan='2'>" + event.caption + "</th></tr>";
      if (event.description && event.description != event.caption) {
		result += "<tr><td colspan='2'>" + this.mkDescr(event.description).innerHTML + "</td></tr>";
      }
      var idx1 = event.date.indexOf ("-");
      var idx2 = event.date.lastIndexOf ("-");
      var yy = event.date.substring (0, idx1);
      var mm = event.date.substring (idx1+1, idx2);
      var dd = event.date.substring (idx2+1);
      result += "<tr><th align='left'>Date:</th><td>" + this.formatDate (yy, mm, dd) + "</td></tr>";
      if (!event.allDay) {
		result += "<tr><th align='left'>Time:</th><td>" + this.formatTimeString(event.stTime) + "-" + this.formatTimeString(event.endTime) + "</td></tr>";
      }
      if (event.location) {
		result += "<tr><th align='left'>Location:</th><td>" + event.location + "</td></tr>";
      }
      for (var key in event) {
		var found = this.knownEvents[key]
		if (found || typeof event[key] != 'string') {
		  continue;
		}
		if (event[key].indexOf("__url") == 0) {
		  var url = event[key].substring(5);
		  result += "<tr><td colspan='2'><a href='" + url + "'>" + key + "</a></td></tr>";
		} else if (event[key].indexOf("http:") == 0 || event[key].indexOf("https:") == 0) {
		  result += "<tr><td colspan='2'><a href='" + event[key] + "'>" + key + "</a></td></tr>";
		} else { result += "<tr><th align='left'>" + key + ":</th><td>" + event[key] + "</td></tr>"	}
      }
      result += "</table>"
      return result;
    }
    
    this.setDetailsHeading = function (heading) {
        this.detailsHeading	= heading;
    }
    
    this.setBubble = function () { this.bubble = true }

    this.setTimeColumnP = function (tcp) {
        this.displayTimeInColumnP = tcp;
    }
   
    this.getEventsFromCalibrate = function (string, zoneID) {
        this.string = string;
        this.zoneID   = zoneID;
        
        var today = new Date ();
        this.getEventsForMonth (today.getFullYear(), today.getMonth()+1);
    }

    this.getEventsForMonth = function (yyyy, mm) {
        this.fromDate = new Date ();
        this.fromDate.setFullYear (yyyy, mm-1, 1);
        this.toDate = new Date ();
        if (mm == 12) {
            mm = 1;
            yyyy ++;
        }
        else {
            mm ++;
        }
        this.toDate.setFullYear (yyyy, mm-1, 1);
        this.toDate.setTime(this.toDate.getTime()-24*60*60*1000);

        this.key = this.fromDate.getFullYear() + "-" + this.fromDate.getMonth();
        if (this.eventMap[this.key] != null) {
            this.renderEventInfo (this.eventMap[this.key]);
        }
        else {
            this.apiHandler = new CalibrateAPI (this.URL, this);
            //this.apiHandler.renderer = this;
            this.apiHandler.key = this.key;
            this.apiHandler.getEvents ( this.zoneID, this.fromDate, this.toDate,
																				this.string, "wp author,wp blog name,wp post url");
        }
    }
    
    this.getEventsForPrevMonth = function (yyyy, mm) {
        if (mm == 1) {
            mm = 12;
            yyyy --;
        }
        else {
            mm --;
        }
        this.getEventsForMonth (yyyy, mm);
    }
        
    this.getEventsForNextMonth = function (yyyy, mm) {
        if (mm == 12) {
            mm = 1;
            yyyy ++;
        }
        else {
            mm ++;
        }
        this.getEventsForMonth (yyyy, mm);
    }
        
    this.dayNames = new Array ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 
                               'Thursday', 'Friday', 'Saturday');
    this.monthNames = new Array ("January", "February", "March",
                                 "April",   "May",      "June",
                                 "July",    "August",   "September",
                                 "October", "November", "December"   );
                                 
  	var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

   	this.click = function (field,val,mode) {
		this[field] = val
		if (mode) {
		  this.mode = mode
		  if (mode == "month" || mode == "year") this.day = 1
		}
		this.getEventsForMonth(this.year,this.month+1)
	}
    
    this.displayMessage = function (message) {
        var schedule = document.getElementById(this.monthID);
        schedule.innerHTML = message;
    }
    
    this.debugMessage = function (message) {
        var div = document.getElementById(this.consoleID);
	if (div != null)
	    div.innerHTML = message;
    }
    
    this.initializeRendering = function () {
    	this
    }

    this.doRendering = function (handler) {
        this.indexEventInfo (handler);
        if (this.apiHandler != handler) {
            return;
        }
        this.renderEventInfo (this.eventMap[handler.key]);
    }
    
    this.renderEventInfo = function (eventInfo) {
        var schedule = document.getElementById(this.monthID);
        schedule.innerHTML = "";
        if (this.detailsID != null) {
            var details = document.getElementById(this.detailsID);
            details.innerHTML = "";
        }
        var self = this; // Needed to get closures in callbacks

        var mm = this.month;
        var yyyy = this.year

        var heading = this.monthNames[mm] + " " + yyyy;

        var thisday = this.day
		var table, inner, elem, img1, img2
		var dt = new Date(); dt.setFullYear(this.year,this.month,this.day)
		if (this.mode == "week") {
			this.nextWeek = new Date(this.week.getTime() + (7*86400000))
		}
		schedule.onclick = function (widget) { return function (evt) {
			if (widget.details == "bubble") hideInfo()
		    evt = evt || event
			var elem = (evt.target) ? evt.target : evt.srcElement
			if (elem.field && (typeof elem.val == "number" || elem.val.constructor == Date)) widget.click(elem.field,elem.val,elem.mode)
  		}}(this)
		schedule.appendChild(DIV({"class" : "calhdr", style : "width:100%;text-align:center;border-top:1px solid white"},img1 = SPAN({"class":"calarrowback",onmouseover: "this.style.cursor=hand"})," ",this.year.toString()," ",img2 = SPAN({"class":"calarrowback",onmouseover: "this.style.cursor=hand"})))
		img1.innerHTML = '&laquo;'; img2.innerHTML = '&raquo;'; img1.field = img2.field = "year"; img1.val = this.year - 1; img2.val = this.year + 1
		schedule.appendChild(DIV({"class" : "cal_lines"},TABLE({onmouseover : "this.style.cursor=hand", "cellSpacing": "1", "cellPadding": "0", width : "100%"}, table = TBODY(inner = TR()))))
		for (var i=0;i<6;i++) {
			inner.appendChild(elem = TD({"class" : (dt.getMonth() == i ? "calmonthon" : "calmonth"),"style":"padding:1px;"},months[i]))
			elem.mode = elem.field = "month"; elem.val = i; 
		}
		inner = table.appendChild(TR())
		for (var i=6;i<12;i++) {
			inner.appendChild(elem = TD({"class" : (dt.getMonth() == i ? "calmonthon" : "calmonth"),"style":"padding:1px;"},months[i]))
			elem.mode = elem.field = "month"; elem.val = i
		}
		inner = table.appendChild(TR())
		inner.appendChild(TD({width: "16.66%", "bgColor": "white","style":"padding:1px;"}," "))
		inner.appendChild(TD({"colSpan" : "5","style":"padding:1px;"},TABLE({width:"100%", "cellSpacing": "1", "cellPadding": "0"},TBODY(TR(TD({"class": "caldayhdr","style":"padding:1px;"},"S"),TD({"class": "caldayhdr","style":"padding:1px;"},"M"),TD({"class": "caldayhdr","style":"padding:1px;"},"T"),
													TD({"class": "caldayhdr","style":"padding:1px;"},"W"),TD({"class": "caldayhdr","style":"padding:1px;"},"T"),TD({"class": "caldayhdr","style":"padding:1px;"},"F"),TD({"class": "caldayhdr","style":"padding:1px;"},"S"))))))
		dt.setDate(1); dt.setDate(dt.getDate() - dt.getDay())
		while ((dt.getMonth() <= this.month && dt.getFullYear() <= this.year)|| (this.month == 0 && dt.getMonth() == 11))  {
			table.appendChild(TR(TD({align: "right","bgColor": "white","class":"week_select","style":"padding:1px;"}, elem = IMG({src: (btn_right_small_defined ? host + "kalendi/portal/images/spacer.gif" : host + "kalendi/portal/images/btn_right_small.gif"), height: "7px", width: "7px", "class": "btn_right_small","style":"width:7px"})),TD({"colSpan" : "5"},TABLE({width: "100%", "cellSpacing": "1", "cellPadding": "0"},TBODY(inner = TR())))))
			elem.mode = elem.field = elem.parentNode.mode = elem.parentNode.field = "week"; elem.val = elem.parentNode.val = new Date(dt.getTime());
			for (var i=0;i<7;i++) {
				var curclass = (dt.getMonth() != this.month ? "caldayout" : 
								(this.mode == "day" && dt.getDate() == this.day ? "caldayon" : 
								 (this.mode == "week" && dt >= this.week && dt < this.nextWeek ? "caldayon" :(this.mode == 'month' ? "caldayon" : "calday"))))
				if (eventInfo && eventInfo[dt.getDate()] != null && dt.getMonth() == this.month) curclass += " caldayhasevents"
				inner.appendChild(elem = TD({"class": curclass, width: "13.28%","style":"padding:1px;"},dt.getDate().toString()))
				if (dt.getMonth() == this.month) {
					elem.mode = elem.field = "day"; elem.val = dt.getDate()
				}
				dt.setDate(dt.getDate() + 1)
			}
		}
//        if (this.detailsID == null) {
//            schedule.appendChild (this.createCredit());
//        }
//        else {
            var table = this.createEventsTable ();
            var details = document.getElementById (this.detailsID);
            details.appendChild (table);
            //details.appendChild (this.createCredit());
            this.eventRows = table.getElementsByTagName("tbody")[0];
//        }
        
        if (thisday < 0) {
            thisday = 1;
        }
				if (this.mode == "month") 
        	this.renderDetails(this.key,yyyy,mm+1, 1, 31)        
        else if (this.mode == "week") {
        	this.renderDetails(this.key,yyyy,mm+1,this.week.getMonth() == mm? this.week.getDate() : 1, this.nextWeek.getMonth() == mm ? this.nextWeek.getDate() : 31)
        } else this.renderDetails (this.key, yyyy, mm+1, thisday);

    }
    
    this.createEventsTable = function () {
        var tab = TABLE({"class": "cal_table"})
        if (this.detailsHeading != null) {
            var thead = document.createElement ("thead");
            tab.appendChild (thead);	    
            var tr = document.createElement ("tr");
            thead.appendChild (tr);
            var th = document.createElement ("th");
            th.setAttribute (document.all ? "className" : "class", "cal_event_heading");
            tr.appendChild (th);
            th.colSpan = 2;
            th.appendChild (document.createTextNode (this.detailsHeading));
        }
        rows = document.createElement ("tbody");
        tab.appendChild (rows);
        return tab;
    }
    
    this.formatDate = function (yyyy, mm, dd, short) {
        var date = new Date ();
        var yr = date.getFullYear()
        date.setFullYear (yyyy, mm-1, dd);
	
        var dow = date.getDay ();
	
        var str = (short ? this.dayNames[dow].substr(0,3) + ", " + months[mm-1] : this.dayNames[dow] + ", " + this.monthNames[mm-1]) + " " + dd + (yr != yyyy ? ", " + yyyy : "");
        return str;
    }

    this.formatTimeString = function (timestr,date) {
        var idx = timestr.indexOf (":");
        
        var hh = timestr.substring (0, idx) - 0;
        var mm = timestr.substring (idx+1);
        var am_pm = "am";
        
        if (hh >= 12) {
            hh -= 12;
            am_pm = "pm";
        }
        
        if (hh == 0) {
            hh = 12;
        }
        
		var dtString = date ? " " + this.formatDate1(date,true) : ""
        return hh + ":" + mm + am_pm + dtString
    }
    
    this.formatDate1 = function (date,short) {
      var idx1 = date.indexOf ("-")
      var idx2 = date.lastIndexOf ("-")
   	  var yy = date.substring (0, idx1) - 0
      var mm1 = date.substring (idx1+1, idx2) - 0
   	  var dd = date.substring (idx2+1) - 0
   	  return this.formatDate(yy,mm1,dd,short)    
    }
    
    this.eventToString = function (info) {
        var s = "";
        for (j in info) {
            s += j + " => " + info[j] + "\n";
        }
        return s;
    }
    
    this.renderDetails = function (key, yyyy, mm, day, endDay) {
        if (!endDay) endDay = day
        var rows = null;
        var table = null;
				var whole_box;
        
        if (this.detailsID == null) {
            table = this.createEventsTable ();
            rows  = table.getElementsByTagName("tbody")[0];
        }
        else {
            rows = this.eventRows;
        }
        
        var kids = rows.childNodes;
        var idx = 0;
	    for (var dy = day; dy<=endDay; dy++) {
        var events = this.eventMap[key] ? this.eventMap[key][dy] : null;
        var date = yyyy + (mm.toString().length == 1 ? "-0" : "-") + mm + (dy.toString().length == 1 ? "-0" : "-") + dy
        if (events == null) {
            events = []
        }	    
		var tr = TR()
		if (day == endDay || events.length > 0) {
			var td = TD({"class": "cal_day_heading", "colSpan": "2","style":"padding:1px;"})
			td.appendChild (document.createTextNode(this.formatDate(yyyy,mm,dy,true)));
			tr.appendChild (td);
			this.replaceOrInsertNode (rows, kids, idx, tr);
			idx ++;
		}
        var len = this.limit ? Math.min(this.limit,events.length) : events.length
        if (len == 0 && this.emptyString && day == endDay) {
          rows.appendChild(TR(TD({"class":"cal_row_even","colSpan":"2","style":"padding:1px;"},this.emptyString)))
          idx++
        } else
        for (var i=0; i<len; i++) {
            var info = events[i];
            //alert (this.eventToString (info));
    
            var rowclass;
            if ((i%2) == 0) {
                rowclass = "cal_row_even";
            }
            else {
                rowclass = "cal_row_odd";
            }
            var tr = TR()
            var td = TD({"class": rowclass,"style":"padding:1px;"})
            td.elementID = info.instanceID
            td.printExpander = function (event,widget) { return function (obj) { 
            					widget.addPrintDetails(obj.lastChild.previousSibling,event) }}(info,this)
						whole_box = td;
			td.onclick = function (widget) { return function (event) { widget.handleListMark(this,event) }}(this)            
            if (!info.allDay) {
                var timestr = document.createTextNode (this.formatTimeString(info.stTime,(date != info.date ? info.date : null)) + "-" + this.formatTimeString(info.endTime, (date != info.endDate ? info.endDate : null)));
                if (this.displayTimeInColumnP) {
                  var nobr = NOBR()
                  nobr.appendChild (timestr);
                  td.appendChild (nobr)
                  td.setAttribute ("valign", "top");
                } else {
                    td.appendChild (timestr);
                    td.appendChild (BR());
                }
            } else if (info.date != info.endDate) {
              var timestr = document.createTextNode(this.formatDate1(info.date,true) + "-" + this.formatDate1(info.endDate,true))
                if (this.displayTimeInColumnP) {
                  var nobr = NOBR()
                  nobr.appendChild (timestr);
                  td.appendChild (nobr)
                  td.setAttribute ("valign", "top");
                } else {
                    td.appendChild (timestr);
                    td.appendChild (BR());
                }              
            }
            if (this.displayTimeInColumnP) {
                if (info.allDay && this.showAlldayIcon) {
	              td.insertBefore(IMG({src: "http://www.kalendi.com/kalendi/portal/images/all_day_icon.gif"}),td.firstChild)
	              //if (info.recurring == "yes" && this.showRecurringIcon) td.appendChild(IMG({"style":"margin-left:5px",src: "http://www.kalendi.com/kalendi/images/RTRAN.gif"}))
	            }
                tr.appendChild (td);
                td = TD({"class": rowclass})
            } else {
                td.colSpan = 2;
            }
            var txt;
            if (info.visibility == 'busy') {
                txt = document.createTextNode ("Busy");
            }
	        else if (this.showCaption || info.description == null || info.description == "") {
	          txt = document.createTextNode (info.caption);
	        } else if (this.showDescription) {
                txt = this.mkDescr (info.description)
            }
	    var aDetails = this.anyDetails(info)
	    if (aDetails) {
		
					var img = IMG({src: this.details == "bubble" ? "http://www.kalendi.com/kalendi/portal/images/bubble_icon2.gif" : "http://www.kalendi.com/kalendi/portal/images/plus.gif"})
					if (this.details == "bubble") img.onclick = function (data) {return function (event) {displayInfo(data,event,0)}}(this.makeInfo(info))
					else img.onclick = function (data,widget) { return function(event) { widget.addDetails(this,data,event) }}(info,this)
					img.onmouseover = onmouseoverFn
		
	    }
	
			// WE NEED TO DIFFERENTIATE CALIBRATE EVENTS FROM WP EVENTS
			var post_url = info["wp post url"];
			if(post_url != null && post_url != "") { // We have a WP event
	
				var innertab
				innertab = TABLE({"width":"100%","cellSpacing":"0","cellPadding":"0"},TBODY());
				td.appendChild(innertab);
				tr.appendChild(td);
				innertab.appendChild(TR());
				innertab = innertab.firstChild;
				td = TD({"class":"cal_row_content", "colSpan": "2","style":"padding:1px;"});
				innertab.appendChild(TR(td));
				td.appendChild(H3({}, info.caption));//"<p>JUSTATEST</p>");
				var url = info["wp post url"];
				if(!url.match("http://"))
					url = "http://" + url;
				var p = P({}, "by: " + info["wp author name"], BR(), "from: " + info["wp blog name"], BR(), A({"href":url, "target":"_blank"}, "Read Post"))
				td.appendChild(p);
	      this.replaceOrInsertNode (this.eventRows, kids, idx, tr);
	      idx ++;
	
			} else { // We have a Kalendi event
	
	      var innertab
	      td.appendChild(innertab = TABLE({"width":"100%","cellSpacing":"0","cellPadding":"0"},TBODY()))
	      tr.appendChild (td)
				
				aName = info["wp author name"];
				if(aName != null && aName != "") {
					innertab.appendChild(P({}, "by: " + aName));
				}
			 
	      innertab.appendChild(TR())
	
	      innertab = innertab.firstChild
	      td = TD({"class":"cal_row_content","colSpan": "2"})
	      innertab.appendChild(TR(td))
	      if (aDetails) td.appendChild(SPAN({style: "margin-right:2px;float:right","class":"noprint"},img))
	      if (info.allDay && this.showAlldayIcon &&!this.displayTimeInColumnP)
	      	td.appendChild(IMG({src: "http://www.kalendi.com/kalendi/portal/images/all_day_icon.gif"}))
	      if (info.recurring == "yes" && this.showRecurringIcon) td.appendChild(IMG({"style":"margin-right:5px",src: "http://www.kalendi.com/kalendi/images/RTRAN.gif"}))
	      td.appendChild (txt);
	      this.replaceOrInsertNode (this.eventRows, kids, idx, tr);
	      idx ++;

			}
	
    }
    for (var i=kids.length-1; i>=idx; i--) {
        this.eventRows.removeChild (kids[i]);
    }
  }
}
    
  this.addDetails = function (obj,event,evt) {
    var innertab = obj.parentNode.parentNode.parentNode.parentNode
    var outertab = obj.parentNode.parentNode.offsetParent.parentNode
    if (innertab.expanded) return
    stop(evt)
    innertab.expanded = outertab.expanded = true
		
			
      if (this.showCaption && event.description && event.description != event.caption) {
		innertab.appendChild(TR({"class":"expanded"},TD({"class":"cal_row_content","colSpan": "3"},mkPrintDescr(event.description,document))))
      }
//      if (event.calendarName) {
//        innertab.appendChild(TR({"class":"expanded"},TH({"class":"cal_row_content",align: "left"},"Calendar: "),TD({"class":"cal_row_content"},event.calendarName)))
//      }
//      if (event.location) {
//		innertab.appendChild(
//			TR({"class":"expanded"},
//				TD({"class":"cal_row_content"},
//				A({"href":"http://" + event.location}, "Go to Post"))))
//      }
    for (var key in event) {
		    var found = this.knownEvents[key]
		    if (found || typeof event[key] != 'string') {
		      continue;
		    }
		
				// If key is a wp prop we don't want it
				if(jQuery.inArray(key, ['wp author', 'wp author name', 'wp post url', 'wp blog url', 'wp blog name']) != -1)
					continue;
				
		    if (event[key].indexOf("__url") == 0) {
		      var url = event[key].substring(5);
		      innertab.appendChild(TR({"class":"expanded"},TH({"class":"cal_row_content",align:"left"}, key + ":"), TD({"class":"cal_row_content","colSpan":"2","style":"padding:1px;"},A({href: url},"Click here"))))
		    } else if (event[key].indexOf("http:") == 0 || event[key].indexOf("https:") == 0) {
		      innertab.appendChild(TR({"class":"expanded"}, TH({"class":"cal_row_content",align:"left"}, key + ":"), TD({"class":"cal_row_content","colSpan": "2","style":"padding:1px;"},A({href: event[key]},"Click here"))))
		    } else if (key.toLowerCase() == 'mapit') {
		    	innertab.appendChild(TR({"class":"expanded"},TH({"class":"cal_row_content",align:"left"},"Get Directions: "), TD({"class":"cal_row_content","colSpan": "2","style":"padding:1px;"},A({onmouseover: "this.style.cursor=hand", onclick: "getDirections(event, '" + event[key].replace(/<br>/gi, " ") + "')", style: "cursor: pointer;text-decoration:underline"},"Click here"))))
		    }else {
			 		if(!key.match("wp "))
			 			innertab.appendChild(TR({"class":"expanded"},TH({"class":"cal_row_content",align:"left"},key,": "),(TD({"class":"cal_row_content","style":"padding:1px;"},event[key])))) }
     }
    obj.src = "http://www.kalendi.com/kalendi/portal/images/minus.gif"
    obj.onclicksave = obj.onclick
    obj.onclick = function (widget) { return function (evt) { stop(evt); return widget.removeDetails(this) }}(this)
  } 
  
  this.addPrintDetails = function (obj,event) {
    var doc = obj.ownerDocument
    var innertab = obj.lastChild
    var tr,td,th
      if (this.showCaption && event.description && event.description != event.caption) {
        innertab.appendChild(tr = doc.createElement("TR"))
        tr.appendChild(td = doc.createElement("TD"))
        td.setAttribute(document.all ? "className" : "class","cal_row_content")
        td.setAttribute("colSpan","2")
        td.appendChild(mkPrintDescr(event.description,doc))
      }
      if (event.location) {
        innertab.appendChild(tr = doc.createElement("TR"))
        tr.appendChild(th = doc.createElement("TH"))
        th.setAttribute(document.all ? "className" : "class","cal_row_content")
        th.setAttribute("align","left")
        th.appendChild(doc.createTextNode("Location: "))
        tr.appendChild(td = doc.createElement("TD"))
        td.setAttribute(document.all ? "className" : "class","cal_row_content")
        td.appendChild(doc.createTextNode(event.location))
      }
      for (var key in event) {
		var found = this.knownEvents[key]
		if (found || typeof event[key] != 'string') {
		  continue;
		}
		if (event[key].indexOf("__url") == 0) {
		  var url = event[key].substring(5);
	      innertab.appendChild(tr = doc.createElement("TR"))
    	  tr.appendChild(td = doc.createElement("TD"))
      	td.setAttribute(document.all ? "className" : "class","cal_row_content")
      	td.setAttribute("colSpan","2")
      	td.appendChild(doc.createTextNode(url))
		} else if (event[key].indexOf("http:") == 0 || event[key].indexOf("https:") == 0) {
	      innertab.appendChild(tr = doc.createElement("TR"))
    	  tr.appendChild(td = doc.createElement("TD"))
	   	  td.setAttribute(document.all ? "className" : "class","cal_row_content")
      	  td.setAttribute("colSpan","2")
      	  td.appendChild(doc.createTextNode(event[key]))
		} else {
	        innertab.appendChild(tr = doc.createElement("TR"))
    	    tr.appendChild(th = doc.createElement("TH"))
        	th.setAttribute(document.all ? "className" : "class","cal_row_content")
	        th.setAttribute("align","left")
    	    th.appendChild(doc.createTextNode(key + ": "))
        	tr.appendChild(td = doc.createElement("TD"))
	        td.setAttribute(document.all ? "className" : "class","cal_row_content")
    	    td.appendChild(doc.createTextNode(event[key]))		
		}
      }
  }   
  
  this.removeDetails = function (obj) {
      var innertab = obj.parentNode.parentNode.parentNode.parentNode
      var outertab = obj.parentNode.parentNode.offsetParent.parentNode
      innertab.expanded = outertab.expanded = false
      while (_hasClass(innertab.lastChild,"expanded")) {
        innertab.removeChild(innertab.lastChild)
      }
	  obj.onclick = obj.onclicksave
	  obj.src = "http://www.kalendi.com/kalendi/portal/images/plus.gif"
  }  
    
  this.handleListMark = function (obj,event,selectAll) {
  	var target = event ? (event.target ? event.target : event.srcElement) : null
  	if (target && target.nodeName == 'A') return
  	if (_hasClass(obj,'mark')) {
  		if (selectAll) return
  		removeClass(obj,'mark'); //unmark(obj)
  		if (obj.elementID) remIf(this.selectedEls,function(n) {return n == obj.elementID})
  	} else {
  		addClass(obj,'mark'); //mark(obj)
  		if (obj.elementID) this.selectedEls.push(obj.elementID)
  	}
  }
  
  this.unmark = function (obj) {
  	if (_hasClass(obj,'mark')) {
  		removeClass(obj,'mark'); //unmark(obj)
  		if (obj.elementID) remIf(this.selectedEls,function(n) {return n == obj.elementID})
  	}
  }
  
  this.replaceOrInsertNode = function (parent, kids, idx, child) {
        if (kids != null && idx < kids.length) {
            parent.replaceChild (child, kids[idx]);
        }
        else {
            parent.appendChild (child);
        }
    }

    this.createCredit = function () {
        var credit = document.createElement ("div");
        credit.setAttribute ("style", "clear: both; padding-top: .5em; text-align: right;");
        var creditline = document.createElement ("div");
        creditline.setAttribute (document.all ? "className" : "class", "cal_credit");
        var ahj = A({"href":"http://www.kalendi.com"})
		ahj.appendChild(IMG({"src":"http://www.kalendi.com/kalendi/images/powered_by.gif","width":"161","height":"23",style:"border:0px"}))
		//img.style.border = "0px"
        creditline.appendChild (ahj);
        credit.appendChild (creditline);
        return credit;
    }

    this.indexEventInfo = function (handler) {
        var eventInfo = handler.eventInfo
        for (var i=0; i<handler.eventInfo.length; i++) {
            var datestr = handler.eventInfo[i].date
            var endDatestr = handler.eventInfo[i].endDate
            var idx1 = datestr.indexOf ("-")
            var idx2 = datestr.lastIndexOf ("-")
            var yy = datestr.substring (0, idx1)      - 0;
            var mm = datestr.substring (idx1+1, idx2) - 0;
            var dd = datestr.substring (idx2+1)       - 0;
			var key = yy + "-" + (mm - 1)
			if (!this.eventMap) this.eventMap = {}
            var startDT = new Date(yy,mm,dd)
            var endDT = new Date(yy,mm,dd)
            //This next statement really screws things up if you have an event whose end date is in the next month, and you
            //haven't pulled data for that month yet.  Then all you see is thia event in the next month.  In other
            //words the widget thinks its already caching next month's data by virtue of having seen the long event.
            //Also, the real purpose of the widget seems to be to list events by the time that they start.  So, for now
            //we won't take the event's real enddate into consideration.
            /*if (endDatestr != datestr) {
				idx1 = endDatestr.indexOf("-")
				idx2 = endDatestr.lastIndexOf("-")
	            var eyy = endDatestr.substring (0, idx1)      - 0;
            	var emm = endDatestr.substring (idx1+1, idx2) - 0;
	            var edd = endDatestr.substring (idx2+1)       - 0;
	            endDT = new Date(eyy,emm,edd)
	        }*/
            while (startDT <= endDT) {
			  if (!this.eventMap[key]) this.eventMap[key] = {}
    	      if (this.eventMap[key][dd] == null) this.eventMap[key][dd] = []
              this.eventMap[key][dd].push (handler.eventInfo[i])
              startDT.setDate(startDT.getDate() + 1)
              yy = startDT.getFullYear()
              mm = startDT.getMonth()
              dd = startDT.getDate()
              key = yy + "-" + (mm -1)
            }
        }
    }
    
    this.getSelectedElsText = function () {
      var els = [], header
      mapDOM(document.getElementById(this.detailsID), 
      		 function (widget) { 
      		 	return function (n) {
      		 	    if (_hasClass(n,"cal_day_heading")) header = n
      		 		else if (n.elementID) { 
      		 			for (var i=0;i<widget.selectedEls.length;i++) 
      		 				if (n.elementID == widget.selectedEls[i]) {
							if (header) {
							  els.push(header); header = null
							}
      		 					els.push(widget.displayTimeInColumnP ? n.parentNode : n)
      		 					return
      		 				}
      		 }}}(this))
      return els
    }

    return this;
}
