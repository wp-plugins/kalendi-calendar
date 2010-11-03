var CalibrateAPICounter = 0;

var root = this;

function CalibrateAPI (URL, renderer) {
    if (!this instanceof CalibrateAPI) {
	return new CalibrateAPI (URL);
    }
    this.URL = URL || "http://www.kalendi.com/kalendi/getEvents.api?"
    this.eventInfo = new Array ();
    this.renderer = renderer
    //this.renderer  = null;
    var scriptID = 'lastLoadedCmds' + renderer.instanceID
    var cb = "CalibrateAPICallback" + renderer.instanceID
    
    this.callServer = function (URL,cb) {
        var head = document.getElementsByTagName('head').item(0);
        var old  = document.getElementById(scriptID);
        if (old) {
            if (document.all) {
                old.removeNode(true); 
            }
            else {
                head.removeChild(old);
            }
        }
        var script = document.createElement('script');
        holdScript = script;
		CalibrateAPICounter ++;
    
	//var cb = "CalibrateAPICallback1" 
    	root[cb] = function (handler) {
        	 return function (status, value) {
            	      handler.handleResponse (status, value);
                	};
	    } (this);        
        script.src = URL + "&jscont="+cb+"&time="+new Date().getTime();
	//alert (script.src);
        //script.src = "foo.js";
        script.type = 'text/javascript';
        script.defer = true;
        script.id = scriptID;
        void(head.appendChild(script));
    }
    
    this.handleResponse = function (status, value) {
        if (status) {
                this.renderer.displayMessage (
                        "Unable to download calendar from <a href=\"http://www.kalendi.com\">Kalendi Business</a>. <br/>" + status.errorMesg);
                return;
        }
        
        this.renderer.initializeRendering (this);
		var i = 0
        while (i<value.length) {
	    if (value[i].visibility == 'open' || value[i].visibility == 'hidden') {
			value.splice(i,1)
	    } else i++
	    this.eventInfo = value
	    //cont()
    }

	this.eventInfo.sort (
		function (s) {
		    return function (a, b) {
			var adate = s.convertResultToDate (a.date);
			var bdate = s.convertResultToDate (b.date);
			if (adate > bdate)
			    return 1;
			if (adate < bdate)
			    return -1;
			if (a.allDay && !b.allDay)
			    return -1;
			if (!a.allDay && b.allDay)
			    return 1;
			if (a.allDay && b.allDay)
			    return 0;
			adate = s.convertResultToTime (adate, a.stTime);
			bdate = s.convertResultToTime (bdate, b.stTime);
			if (adate > bdate)
			    return 1;
			if (adate < bdate)
			    return -1;
			return 0;
		    };
		} (this));
        
        this.renderer.doRendering (this);

    }
    
    this.convertResultToDate = function (datestr) {
        var idx1 = datestr.indexOf ("-");
        var idx2 = datestr.lastIndexOf ("-");
      
        var yy = datestr.substring (0, idx1)      - 0;
        var mm = datestr.substring (idx1+1, idx2) - 0;
        var dd = datestr.substring (idx2+1)       - 0;
            
        var date = new Date ();
        date.setFullYear (yy, mm-1, dd);
	date.setHours (0, 0, 0, 0);
        return date;
    }   

    this.convertResultToTime = function (date, timestr) {
        var idx = timestr.indexOf (":");

        var hh = timestr.substring (0, idx) - 0;
        var mm = timestr.substring (idx+1);

	date.setHours (hh, mm, 0, 0);
	return date;
    }

    this.isArray = function (obj) {
	return obj.constructor == Array;
    }
    
    this.convertToArgs = function (data) {
	var str = "";
	for (var key in data) {
	    if (this.isArray(data[key])) {
		for (var i=0; i<data[key].length; i++) {
		    if (str != "") {
		     str += "&";
		    }
		    str += key;
		    str += '=';
		    str += encodeURI (data[key][i]);

		}
	    }
	    else {
		if (data[key] != null && data[key] != "") {
		    if (str != "") {
		     str += "&";
		    }
		    str += key;
		    str += '=';
		    str += encodeURI (data[key]);
		}
	    }
	}
	return str;
    }
    
    this.convertDateToString = function (date) {
	var str = "";
	if (date.getMonth()+1 < 10) {
	   str += "0";
	}
	str += "" + (date.getMonth () + 1);
	str += "-"
	if (date.getDate() < 10) {
	   str += "0";
	}
	str += "" + date.getDate ();
	str += "-"
	str += date.getFullYear ();
	return str;
    }
    
    this.getEvents = function (zoneID, fromDate, toDate, search, fields) {
	var params = {}
	if (zoneID != null) {
	    params['zoneID'] = zoneID;
	}
	params['fields'] = fields;
	if (search) params.string = search
	var toDateExclusive = new Date ();
	toDateExclusive.setTime (toDate.getTime()+24*60*60*1000);
	params['startDT'] = this.convertDateToString (fromDate);
	params['endDT'] = this.convertDateToString (toDateExclusive);
	// Here is where the machine name should go
	var url = this.URL
	url += this.convertToArgs (params);
	this.callServer (url, cb);
    }

    return this;
}
