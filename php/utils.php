<?php
require_once "XML/RSS.php";

function match($whole_string, $string_to_match) {
	return (boolean)strstr($whole_string, $string_to_match);
}

function varlog($var, $message = '') {
	mlog($message . "\n" . var_export($var, true));
}

function mlog($message = '') {	
	global $debug_mode;
	if($debug_mode) {
		$myFile = "/tmp/kalendiWordPress.log";
		$fh = fopen($myFile, 'a');
		fwrite($fh, "\n\n" . date_i18n("r\n") . $message . "\n");
		fclose($fh);
	}
}

function convert_timezone($zoneid) {
  if ($zoneid == '' || empty($zoneid)) $zoneid = @date("e");
  return str_replace("UTC","GMT",$zoneid);
}

function delete_options() {
  delete_option('kalendi_username');
  delete_option('kalendi_password');
  delete_option('kalendi_watch_list');
  delete_option('kalendi_posts_to_fetch');
  delete_option('kalendi_company_created');
  delete_option('kalendi_account_activated');
  delete_option('kalendi_calendar_id');
  delete_option('kalendi_custom_props_created2');
}

class KalendiWordPressUtils {
	
	public function myTruncate($string, $limit, $break=".", $pad="...")
	{
	  // return with no change if string is shorter than $limit
	  if(strlen($string) <= $limit) return $string;

	  // is $break present between $limit and the end of the string?
	  if(false !== ($breakpoint = strpos($string, $break, $limit))) {
	    if($breakpoint < strlen($string) - 1) {
	      $string = substr($string, 0, $breakpoint) . $pad;
	    }
	  }
		
	  return $string;
	}
	
	public function checkKalendiAccount() {
		$verified = (boolean)get_option("kalendi_account_activated");
		if(!$verified) {
			//mlog("IN not verified");
			// We need to check the Kalendi API response to see if the account is valid
			$params = array(
				"userName" => get_option("kalendi_username"),
				"password" => get_option("kalendi_password")
			);
			$content = $this->makeKalendiAPIPost("getCompany", $params);
			$found = (boolean)strstr($content, "companyData");
			//varlog($found, "in checkCALAccount content=");
			// If the account IS valid we perform the initialize routine now
			if($found) {
				$success = $this->performAccountInitialization();
				if($success) {
					update_option('kalendi_account_activated', TRUE);
					return TRUE;
				}
				return FALSE;
			} 
			return FALSE;
		}
		$custom_props_exist = get_option('kalendi_custom_props_created2');
		if(!$custom_props_exist) {
			$success = $this->performAccountInitialization();			
		}
		return TRUE;
	}
	
	public function getWPCalendars() {
		$params = array(
			"userName" => get_option("kalendi_username"),
			"password" => get_option("kalendi_password")
		);
		$content = "";
		
		$content = $this->makeKalendiAPIPost("getPublicCalendar", $params);
		$arr = array();
	
		$found = strpos($content, "<calendarID>");
		if($found === FALSE) {}
		else{
			
			$xml = new SimpleXMLElement($content);
		
			foreach ($xml->calendar as $calendar){
				
				if ($calendar->calendarName == "wp-posts"){
					
					if ($calendar->description != "")
						$arr[(string)$calendar->description] = $calendar->description;
					else
						$arr[(string)$calendar->owner] = $calendar->owner;
					
				}
			}
		}	
		return $arr;
	}
	
	public function updateCalendars(){
		$replaced_list = explode("\n", get_option("kalendi_watch_list"));
		$arr = $replaced_list;

		foreach($arr as $i){
			varlog("http://".trim($i)."/?feed=rss2", "Watch Blog:");
			$handle = fopen("http://".trim($i)."/?feed=rss2","r");
			
			if ($handle){
				fclose($handle);
				varlog("http://".$i."/?feed=rss2", "File Exists:");
				$rss = & new XML_RSS("http://".trim($i)."/?feed=rss2");
				if (!$rss){
					$rss = & new XML_RSS("http://".trim($i)."/feed");
				}
				$rss->parse();
				$channel = $rss->getChannelInfo();
				
				$params = array(
					'fields' => "wp-posts",
					'searchString' => trim($i),
					'userName' => get_option('kalendi_username'),
					'password' => get_option('kalendi_password')
				);
				
				$content = $this->makeKalendiAPIPost('getPublicCalendar', $params);
				preg_match('@<calendarID>(.+?)</calendarID>@is', $content, $matches);
				
				varlog($content,"getPublicCalendar:");
				
				if(!empty($matches[1])) {
					
					//get latest post timestamp
					$params = array(
						'key' => "latest",
						'calendarID' => $matches[1],
						'userName' => get_option('kalendi_username'),
						'password' => get_option('kalendi_password')
					);

					$content = $this->makeKalendiAPIPost('getCalendarMetaData', $params);
					varlog($content,"Meta Data - Latest entry:");
					preg_match('@<data key="latest">(.+?)</data>@is', $content, $latest);
					
					$count = 0;
					foreach ($rss->getItems() as $entry)
					{
						varlog(strtotime($entry['pubdate']), "Update Blog Entry Time:");
						varlog($latest[1], "Latest Update Time:");
						if (strtotime($entry['pubdate'] < $latest[1])){
							
						}else{
								 
							if ($count == 0){
								$params = array(
									'key' => "latest",
									'value' => strtotime($entry['pubdate']),
									'calendarID' => $matches[1],
									'userName' => get_option('kalendi_username'),
									'password' => get_option('kalendi_password')
								);

								$content = $this->makeKalendiAPIPost('addCalendarMetaData', $params);
							}
							
							varlog($entry['pubdate'], "Pub Date:");
							varlog(strtotime($entry['pubdate']), "Timestamp:");
							$start_date = date_i18n("m-d-Y", strtotime($entry['pubdate']), true);	
							varlog($start_date,"Blog start date:");
							$username = get_option('kalendi_username');
							$password = get_option('kalendi_password');
							$author = $entry['dc:creator'];
							$post_url = $entry['link'];
						
							$blog_name = $channel['title'];
							$blog_url = $channel['link'];
							$author_name = $entry['dc:creator'];
						
							if(empty($author_name) || $author_name == " ") {
								$author_name = "Unknown";
							}
						
							$custom_props = array(
								"wp author:$author",
								"wp post url:$post_url",
								"wp blog name:$blog_name",
								"wp author name:$author_name",
								"wp blog url:$blog_url"
								);
							$custom_props = implode(",", $custom_props);
						
							$description = $entry['description'];
							$search = array("<![CDATA[", "]]>");
							$replace = array("", "");
							$description = str_replace($search, $replace, $description);
							$description = $this->myTruncate($description, 100);
						
							$params = array(
								'caption' => $entry['title'],
								'description' => $description,
								'allDay' => 'yes',
								'startDT' => $start_date,
								'customProp' => $custom_props,
								'calendarID' => $matches[1],
								'visibility' => 'public',
								'userName' => $username,
								'password' => $password				
								);
							$content = $this->makeKalendiAPIPost("addEvent", $params);
							$count++;
						}
					}
				}
				
			}
		}
	}
	
	//create new calendars and add events from options watch list via rss feeds
	public function createCalendars(){
		
		$replaced_list = explode("\n", get_option("kalendi_watch_list"));
		$arr = $replaced_list;
		foreach($arr as $i){
			varlog("http://".trim($i)."/?feed=rss2", "Watch Blog:");
			$handle = fopen("http://".trim($i)."/?feed=rss2","r");
			
			if ($handle){
				fclose($handle);
				varlog("http://".$i."/?feed=rss2", "File Exists:");
				$rss = & new XML_RSS("http://".trim($i)."/?feed=rss2");
				if (!$rss){
					$rss = & new XML_RSS("http://".trim($i)."/feed");
				}
				$rss->parse();
				$channel = $rss->getChannelInfo();
				varlog($channel['title'], "Channel Name:");
				
				$params = array(
					'calendarID' => get_option('kalendi_calendar_id'),
					'startDT' => date_i18n("m-d-Y", strtotime("6 months ago")),
					'string' => $channel['link'],
					'fields' => 'wp author,wp blog name,wp post url',
					'userName' => $username,
					'password' => $password
				);
				//varlog($params, "GetEvents API Call Params:");
				$content = $this->makeKalendiAPIPost("getEvents", $params);

				//varlog($content, "GetEvents API Call Return:");		
				$found = strpos($content, "<eventID>");
				//varlog($found, "Found variable: ");
				if($found === FALSE) {
				
					$params = array(
						'name' => $channel['title'],
						'type' => 'Public',
						'zoneID' => convert_timezone(get_option('timezone_string')),
						'subscribe' => 'yes',
						'publishWeb' => 'yes',
						'publishICS' => 'yes',
						'description' => str_replace("http://", "", $channel['link']),
						'userName' => get_option('kalendi_username'),
						'password' => get_option('kalendi_password')
						);
					$content = $this->makeKalendiAPIPost('createCalendar', $params);
					preg_match('@<calendarID>(.+?)</calendarID>@is', $content, $matches);
					varlog($matches[1], "Matches:");
					//create calendar was successful
					if(!empty($matches[1])) {
						$params = array(
							'key' => "wp-posts",
							'value' => trim($i),
							'calendarID' => $matches[1],
							'userName' => get_option('kalendi_username'),
							'password' => get_option('kalendi_password')
							);

						$content = $this->makeKalendiAPIPost('addCalendarMetaData', $params);
						varlog($content,"Add Meta Data:");
						$count = 0;
						foreach ($rss->getItems() as $entry)
						{
							if ($count == 0){
								$params = array(
									'key' => "latest",
									'value' => strtotime($entry['pubdate']),
									'calendarID' => $matches[1],
									'userName' => get_option('kalendi_username'),
									'password' => get_option('kalendi_password')
									);

								$content = $this->makeKalendiAPIPost('addCalendarMetaData', $params);
							}
							varlog($entry['pubdate'], "Pub Date:");
							varlog(strtotime($entry['pubdate']), "Timestamp:");
							$start_date = date_i18n("m-d-Y", strtotime($entry['pubdate']), true);	
							varlog($start_date,"Blog start date:");
							$username = get_option('kalendi_username');
							$password = get_option('kalendi_password');
							$author = $entry['dc:creator'];
							$post_url = $entry['link'];

							$blog_name = $channel['title'];
							$blog_url = $channel['link'];
							$author_name = $entry['dc:creator'];

							if(empty($author_name) || $author_name == " ") {
								$author_name = "Unknown";
							}

							$custom_props = array(
								"wp author:$author",
								"wp post url:$post_url",
								"wp blog name:$blog_name",
								"wp author name:$author_name",
								"wp blog url:$blog_url"
								);
							$custom_props = implode(",", $custom_props);

							$description = $entry['description'];
							$search = array("<![CDATA[", "]]>");
							$replace = array("", "");
							$description = str_replace($search, $replace, $description);
							$description = $this->myTruncate($description, 100);

							$params = array(
								'caption' => $entry['title'],
								'description' => $description,
								'allDay' => 'yes',
								'startDT' => $start_date,
								'customProp' => $custom_props,
								'calendarID' => $matches[1],
								'visibility' => 'public',
								'userName' => $username,
								'password' => $password				
								);
							$content = $this->makeKalendiAPIPost("addEvent", $params);
							varlog($content,"Add Event return:");
							$count++;
						}			
				}
			}
	}
		
	}
}
	
	protected function addCustomProp($label) {
		// Add the basic custom prop params
		$params = array(
			'userName' => get_option('kalendi_username'),
			'password' => get_option('kalendi_password'),
			'required' => 'n',
			'type' => 'String',
			'label' => $label
		);
		
		// Now we add the custom prop
		$result = $this->makeKalendiAPIPost('addCustomProp', $params);
		varlog($result, "Result of addCustomProp on $label");
		if((boolean)strstr($result, "success")) {
			return TRUE;
		} else if( (boolean)strstr($result, "This operation requires administrative privileges")) {
			return FALSE;
		} else {
			return FALSE;
		}
	}
	
	public function performAccountInitialization() {
		// TODO: Maybe we import the previous blog posts as an ICS file when we create the calendar.
		// Get the custom properties
		$username = get_option('kalendi_username');
		$password = get_option('kalendi_password');
		
		$custom_props_exist = get_option('kalendi_custom_props_created2');		
		if(!$custom_props_exist) {			
			$author_created = $this->addCustomProp("wp author");
			$author_name_created = $this->addCustomProp("wp author name");
			$post_url_created = $this->addCustomProp("wp post url");
			$blog_name_created = $this->addCustomProp("wp blog name");
			$blog_url_created = $this->addCustomProp("wp blog url");
			
			if(!($author_created || $post_url_created || $blog_name_created || $author_name_created)) {
				mlog("Creating one of the custom props failed!");
				// Lets see if the custom props exist already... if so we are OK
				$params = array(
					'userName' => $username,
					'password' => $password
				);
				$content = $this->makeKalendiAPIPost('getCustomProps', $params);
				
				if(match($content, 'wp author') && match($content, 'wp post url') && match($content, 'wp blog name') && match($content, 'wp author name')) {					
					update_option('kalendi_custom_props_created2', TRUE);
				} else {
					return FALSE;					
				}
				
			} else {				
				update_option('kalendi_custom_props_created2', TRUE);
			}
		}
		
		$calendar_id = get_option('kalendi_calendar_id');
		varlog($calendar_id, "Calendar ID in performAccountInitialization");
		if(empty($calendar_id)) {
		  if ($tz == '') $tz = date("e");
			$params = array(
				'name' => 'wp-posts',
				'type' => 'Public',
				'zoneID' => convert_timezone(get_option('timezone_string')),
				'subscribe' => 'yes',
				'publishWeb' => 'yes',
				'publishICS' => 'yes',
				'description' => str_replace("http://", "", get_bloginfo('url')),
				'userName' => $username,
				'password' => $password
			);
			$content = $this->makeKalendiAPIPost('createCalendar', $params);
			
			preg_match('@<calendarID>(.+?)</calendarID>@is', $content, $matches);
			varlog($matches[1], "Matches:");
			if(!empty($matches[1])) {
				update_option('kalendi_calendar_id', $matches[1]);
				return TRUE;
			} else {
				// Lets see if the calendar exists already... if so we are OK
				$params = array(
					'userName' => $username,
					'password' => $password
				);
				$content = $this->makeKalendiAPIPost('getCalendar', $params);
				if(match($content, 'wp-posts')) {
					// We need to loop through each returned calendar in the XML and look for 'our' calendar...					
					$xml = new SimpleXMLElement($content);
					foreach($xml->calendar as $calendar) {
						if($calendar->calendarName == 'wp-posts') {
							update_option('kalendi_calendar_id', (string)$calendar->calendarID);
							return TRUE;
						}
					}
					return FALSE;
				} else {
					return FALSE;					
				}
			}
		}	else {
			return TRUE;
		}	
		
		// TODO: Maybe we need to import blog posts as events here... right now we will leave this out, because it will be an expensive operation. 
	}
	
	public function getPostGUID($post) {
		return $post->guid;
	}
	
	function myUrlEncode($string) {
    $entities = array('%21', '%2A', '%27', '%28', '%29', '%3B', '%3A', '%40', '%26', '%3D', '%2B', '%24', '%2C', '%2F', '%3F', '%25', '%23', '%5B', '%5D');
    $replacements = array('!', '*', "'", "(", ")", ";", ":", "@", "&", "=", "+", "$", ",", "/", "?", "%", "#", "[", "]");
    return str_replace($entities, $replacements, urlencode($string));
	}
	
	public function PostRequest($url, $referer, $_data, $port = 80) { 
    // convert variables array to string:
    $data = array();    
    while(list($n,$v) = each($_data)){
			$data[] = urlencode($n) . "=" . urlencode($v);
    }    
    $data = implode('&', $data);
		$search = array("%5C%27");
		$replace = array("%27");
		$data = str_replace($search, $replace, $data);
    // format --> test1=a&test2=b etc.

    // parse the given URL
    $url = parse_url($url);
    if ($url['scheme'] != 'http') { 
			die('Only HTTP request are supported !');
    }

    // extract host and path:
    $host = $url['host'];
    $path = $url['path'];

    // open a socket connection on port $port
    $fp = fsockopen($host, $port);

		if(!$fp) {
			
			return array(NULL, NULL);
			
		} else {
			
			varlog($data, "DATA SENT TO " . $url);

	    // send the request headers:
	    fputs($fp, "POST $path HTTP/1.0\r\n");
	    fputs($fp, "Host: $host\r\n");
	    fputs($fp, "Referer: $referer\r\n");
	    fputs($fp, "Content-type: application/x-www-form-urlencoded\r\n");
	    fputs($fp, "Content-length: ". strlen($data) ."\r\n");
	    fputs($fp, "Connection: close\r\n\r\n");
	    fputs($fp, $data);

	    $result = ''; 
	    while(!feof($fp)) {
				// receive the results of the request
				$result .= fgets($fp, 128);
	    }

	    // close the socket connection:
	    fclose($fp);

	    // split the result header from the content
	    $result = explode("\r\n\r\n", $result, 2);

	    $header = isset($result[0]) ? $result[0] : '';
	    $content = isset($result[1]) ? $result[1] : '';

	    // return as array:
	    return array($header, $content);	
		}
	}
	
	public function makeKalendiAPIPost($apiCall, $params) {
		/*global $current_user;
		get_currentuserinfo();
		$username = $params["userName"];
		$password = $params["password"];
		if(empty($username)) $username = $current_user->user_email;
		if(empty($password)) $password = $current_user->kalendi_password;
		$params["userName"] = $username;
		$params["password"] = $password;*/
		$url = 'http://www.kalendi.com/kalendi/' . $apiCall . '.api';
		$referer = 'http://www.kalendi.com';
		//varlog($params, "In makeKalendiAPIPost '$apiCall' params=");
		list($header, $content) = $this->PostRequest($url, $referer, $params, 80);
		
		$search = array("<description>", "</description>");
		$replace = array("<description><![CDATA[", "]]></description>");
		$content = str_replace($search, $replace, $content);
		
		return $content;
	}

	public static function load_scripts() {

		?><script type="text/javascript" 			src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
			<script language="Javascript">
			$(document).ready(function () {
			  require("<?php echo WP_PLUGIN_URL ?>/kalendi-calendar/javascripts/widgetbasics.js")
			  require("<?php echo WP_PLUGIN_URL ?>/kalendi-calendar/javascripts/dombuilder.js")
			  require("<?php echo WP_PLUGIN_URL ?>/kalendi-calendar/javascripts/events-api.js")
			  require("<?php echo WP_PLUGIN_URL ?>/kalendi-calendar/javascripts/widget_mm.js")
			  require("<?php echo WP_PLUGIN_URL ?>/kalendi-calendar/javascripts/bubble.js")
			  require("<?php echo WP_PLUGIN_URL ?>/kalendi-calendar/javascripts/printcontrol.js")
			  require("<?php echo WP_PLUGIN_URL ?>/kalendi-calendar/javascripts/SearchAttribute.js", get_vt_events776)
			})
			
			function require(URL, onload) {
			  doc = document
			  var scripts = document.getElementsByTagName("script")
			  for (var i=0;i<scripts.length;i++)
			    if (scripts[i].src == URL) return
			    var head = doc.getElementsByTagName('head').item(0)
			    var script = doc.createElement('script')
			    script.src = URL
			    if (script.readyState) {
			      script.onreadystatechange = function(){
			          if (script.readyState == "loaded" ||
			              script.readyState == "complete"){
			            script.onreadystatechange = null;
			            onload();
			            }
			        };
			    } else script.onload = onload
			    script.type = 'text/javascript'
			    void(head.appendChild(script))
			}
			
			function get_vt_events776(){
				cals = ["C/UW Computer Science/Jeffrey Van Baalen/WordPress"]
				// Create an instance of the month widget
			    var x = new CalibrateMonthWidget ("schedule_mm776",     // ID of div to hold month
			                                      "details_mm776"      // ID of div to hold details
			                                     );                           
			    x.setTimeColumnP (false); // call with true to get two column display
			    x.setDetails("plusminus") // bubble, plusminus, or null
			    x.showDescription = true // if not set description will not show (but will show on bubble or plusminus)
			    x.showAlldayIcon = true // if not set all day icon will not be shown
			    x.showRecurringIcon = true // if not set recurring icon will not be shown
			    x.emptyString = "No events during this time"
			    x.showCaption = true // If set to true, the caption will override showing of the description
			    x.mode = "week" // startup mode
			    x.getEventsFromCalibrate ("<?php 
						$replaced_list = preg_replace("/\s+/", " ", get_option("kalendi_watch_list"));
						
						/*$options = get_option("kalendi_watch_list");
						foreach($options as $i => $value){
							$replaced_list .= $value . " ";
						}*/
						//varlog($replaced_list, "REPLACED LIST");
						
						if(empty($replaced_list)) {
							$searchStr = get_bloginfo('url');
						} else {
							$arr = array($replaced_list, get_bloginfo('url'));
							$searchStr = implode(" ", $arr);
						}
						
						echo $searchStr;
					?>", "<?php echo convert_timezone(get_option("timezone_string")) ?>");
			}
			
			function addLoadEvent(func)
			{	
				var oldonload = window.onload;
				if (typeof window.onload != 'function')
				{
			    	window.onload = func;
				} 
				else 
				{
					window.onload = function(){oldonload();func();}
				}
			}
			
			addLoadEvent(get_vt_events776);
			</script>
		<?php
	}
	
	
	public static function sidebar_content() {
		?>
			<div id="widget776" style="padding-top:15px; width:190px; margin-right:auto; margin-left:auto">
				<div style="width:180px; ">
					<div id="schedule_mm776" style="width:180px; margin-bottom:0px;"></div>
				</div>
				<div id="details_mm776" style="width:180px">Downloading calendar events from <a href="http://www.kalendi.com">Kalendi</a>&#8230;
				</div>
				<div align="center" style="margin:5px;font-size:9px;">
					<a href="http://wordpress.org/extend/plugins/kalendi-calendar/" target="_blank">Kalendi Calendar Plugin</a>
				</div> 
			</div>
		<?php
	}
	
	public static function styles($color1, $color2, $color3) {
		if(empty($color1)) $color1 = "#000";
		if(empty($color2)) $color2 = "#ddd";
		if(empty($color3)) $color3 = "#fff";
	?>
		<style type="text/css">
			#widget776 * {
			background:transparent none repeat scroll 0 50%;
			border:0 none transparent;
			border-collapse:collapse;
			font-family:Verdana,Arial,Helvetica,sans-serif;
			margin:0;
			padding:0;
			}
			#widget776 {
			margin:0 0 1em;
			}
			#widget776 input {
			border:1px solid <?php echo $color1 ?>;
			}
			#widget776 .cal_table {
			font-family:Arial,Helvetica,sans-serif;
			font-size:12px;
			width:100%;
			}
			#widget776 table {
			table-layout:fixed;
			word-wrap:break-word;
			width:100%;
			margin:0px;
			}
			#widget776 .cal_lines {
			background-color:<?php echo $color3 ?>;
			border:1px solid <?php echo $color1 ?>;
			width:auto;
			}
			#widget776 .cal_event_heading {
			background-color:<?php echo $color1 ?>;
			color:<?php echo $color3 ?>;
			font-size:10pt;
			font-weight:bold;
			text-align:center;
			text-transform:capitalize;
			}
			#widget776 #schedule_mm776 {
			margin:0 0 1em;
			}
			#widget776 #searchAndLogo {
			margin:0px;
			}
			#widget776 #widget776 .logo {
			margin:0 0 0 2em;
			}
			#widget776 .cal_event_heading a:link {
			color:<?php echo $color3 ?>;
			text-decoration:none;
			}
			#widget776 .cal_event_heading a:visited {
			color:<?php echo $color3 ?>;
			text-decoration:none;
			}
			#widget776 .cal_event_heading a:hover {
			color:<?php echo $color3 ?>;
			text-decoration:none;
			}
			#widget776 td {
			padding:1px;
			border:0px;
			}
			#widget776 tr td{
			padding:1px;
			border:0px;
			}
			#widget776 .cal_day_heading {
			background-color:<?php echo $color1 ?>;
			color:<?php echo $color3 ?>;
			font-size:1.2em;
			font-weight:bold;
			padding:0.25em 1em 0.25em 0.5em;
			text-align:left;
			text-transform:capitalize;
			}
			#widget776 .cal_day_empty {
			background-color:<?php echo $color3 ?>;
			color:<?php echo $color1 ?>;
			}
			#widget776 .cal_day_today {
			background-color:<?php echo $color3 ?>;
			color:<?php echo $color1 ?>;
			}
			#widget776 .cal_day_selected {
			}
			#widget776 .cal_day_normal {
			font-size:8pt;
			}
			#widget776 .cal_row_even, #widget776 .cal_row_odd {
			padding:5px;
			}
			#widget776 .cal_row_even {
			background-color:<?php echo $color2 ?>;
			}
			#widget776 .cal_row_odd {
			background-color:<?php echo $color3 ?>;
			border:1px solid <?php echo $color2 ?>;
			}
			#widget776 .cal_row_content {
			color:<?php echo $color1 ?>;
			font-size:8pt;
			width:170px;
			}
			#widget776 .cal_row_even a:link {
			background-color:transparent;
			color:<?php echo $color1 ?>;
			font-size:8pt;
			text-decoration:underline;
			}
			#widget776 .cal_row_even a:visited {
			background-color:transparent;
			color:<?php echo $color1 ?>;
			font-size:8pt;
			text-decoration:underline;
			}
			#widget776 .cal_row_even a:hover {
			background-color:transparent;
			color:<?php echo $color1 ?>;
			font-size:8pt;
			text-decoration:underline;
			}
			#widget776 .cal_row_odd a:link {
			background-color:transparent;
			color:<?php echo $color1 ?>;
			font-size:8pt;
			text-decoration:underline;
			}
			#widget776 .cal_row_odd a:visited {
			background-color:transparent;
			color:<?php echo $color1 ?>;
			font-size:8pt;
			text-decoration:underline;
			}
			#widget776 .cal_row_odd a:hover {
			background-color:transparent;
			color:<?php echo $color1 ?>;
			font-size:8pt;
			text-decoration:underline;
			}
			#widget776 .cal_credit, #widget776 .cal_credit a:link, #widget776 .cal_credit a:visited, #widget776 .cal_credit a:hover {
			font-size:9px;
			}
			#widget776 .mark, #widget776 .mark .cal_row_content {
				
			}
			#widget776 .calhdr {
			border:none !important;
			color:<?php echo $color1 ?>;
			font-size:1.2em;
			font-weight:bold;
			line-height:20px;
			width:auto;
			}
			#widget776 .calmonth {
			background-color:<?php echo $color1 ?>;
			color:<?php echo $color3 ?>;
			font-size:10px;
			font-weight:bold;
			text-align:center;
			text-decoration:none;
			}
			#widget776 .calmonthon {
			background-color:<?php echo $color2 ?>;
			color:<?php echo $color1 ?>;
			font-size:10px;
			font-weight:bold;
			text-align:center;
			text-decoration:none;
			}
			#widget776 .caldayhdr {
			background-color:<?php echo $color3 ?>;
			color:<?php echo $color1 ?>;
			font-size:10px;
			font-weight:bold;
			text-align:center;
			text-decoration:none;
			width:13%;
			}
			#widget776 .calday {
			background-color:<?php echo $color3 ?>;
			color:<?php echo $color1 ?>;
			font-size:10px;
			line-height:17px;
			text-align:center;
			text-decoration:none;
			}
			#widget776 .caldayon {
			background-color:<?php echo $color2 ?>;
			color:<?php echo $color1 ?>;
			font-size:10px;
			line-height:17px;
			text-align:center;
			text-decoration:none;
			}
			#widget776 .caldayout {
			background-color:<?php echo $color3 ?>;
			color:<?php echo $color2 ?>;
			font-size:10px;
			text-align:center;
			text-decoration:none;
			}
			#widget776 .calnodata {
			font-size:14px;
			font-style:normal;
			}
			#widget776 .calarrowback {
			background-color:transparent;
			color:<?php echo $color1 ?>;
			}
			#widget776 .caldayhasevents {
			text-decoration:underline;
			}

			/*styles for directions popup*/
			.helpOuter {
				margin-left:5px;
			}

			.helpIcon {
				background: url(help.gif) no-repeat; 
				width:14px;
				height:12px;
			}
			.directions_main {
				background: <?php echo $color3 ?> none repeat scroll 0%;
				border:<?php echo $color1 ?> 2px solid;
			}

			.directions_bold_text {
				color: <?php echo $color1 ?>;font-size:13px;font-weight:bold;
			}

			.directions_close {
				padding-top:0px; padding-right:0px;
			}
			.directions_close_Icon { 
				background:url(http://www.kalendi.com/kalendi/images/close.gif) no-repeat top;	
				height:26px;width:27px
			}

			.tooltip {
				background-color:<?php echo $color3 ?>;
				border:1px solid <?php echo $color1 ?>;
			}

			.tooltip_close {
				background:url(tooltip_close.gif) no-repeat top;	
				height:14px;width:13px
			}

			.tooltip_text {
				font-family:Verdana,Arial,Helvetica,sans-serif;
				font-size:12px;
			}
		</style>
	<?php
	}
	
	function submit_post($post, $start_date = NULL) {	
		if($start_date == NULL)
			$start_date = date_i18n("m-d-Y");	
		$username = get_option('kalendi_username');
		$password = get_option('kalendi_password');
		$user = get_userdata($post->post_author);
		$author = $user->user_email;
		$post_url = $this->getPostGUID($post);
		$blog_name = get_bloginfo();
		$blog_url = get_bloginfo('url');
		$author_name = $user->first_name . " " . $user->last_name;
		if(empty($author_name) || $author_name == " ") {
			$author_name = "Unknown";
		}
		$custom_props = array(
			"wp author:$author",
			"wp post url:$post_url",
			"wp blog name:$blog_name",
			"wp author name:$author_name",
			"wp blog url:$blog_url"
		);
		$custom_props = implode(",", $custom_props);
		$description = $this->myTruncate($post->post_content, 100);
		$params = array(
			'caption' => $post->post_title,
			'description' => $description,
			'allDay' => 'yes',
			'startDT' => $start_date,
			'customProp' => $custom_props,
			'calendarID' => get_option('kalendi_calendar_id'),
			'visibility' => 'public',
			'userName' => $username,
			'password' => $password				
		);
		$content = $this->makeKalendiAPIPost("addEvent", $params);
		return $content;
	}
	
	function check_email_address($email) {
	  // First, we check that there's one @ symbol, 
	  // and that the lengths are right.
	  if (!ereg("^[^@]{1,64}@[^@]{1,255}$", $email)) {
	    // Email invalid because wrong number of characters 
	    // in one section or wrong number of @ symbols.
	    return false;
	  }
	  // Split it into sections to make life easier
	  $email_array = explode("@", $email);
	  $local_array = explode(".", $email_array[0]);
	  for ($i = 0; $i < sizeof($local_array); $i++) {
	    if
	(!ereg("^(([A-Za-z0-9!#$%&'*+/=?^_`{|}~-][A-Za-z0-9!#$%&
	↪'*+/=?^_`{|}~\.-]{0,63})|(\"[^(\\|\")]{0,62}\"))$",
	$local_array[$i])) {
	      return false;
	    }
	  }
	  // Check if domain is IP. If not, 
	  // it should be valid domain name
	  if (!ereg("^\[?[0-9\.]+\]?$", $email_array[1])) {
	    $domain_array = explode(".", $email_array[1]);
	    if (sizeof($domain_array) < 2) {
	        return false; // Not enough parts to domain
	    }
	    for ($i = 0; $i < sizeof($domain_array); $i++) {
	      if
	(!ereg("^(([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9])|
	↪([A-Za-z0-9]+))$",
	$domain_array[$i])) {
	        return false;
	      }
	    }
	  }
	  return true;
	}
	
}

?>