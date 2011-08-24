<?php
// create custom plugin settings menu


class kalendi_wordpress_options {	
	
	protected $util;// = new KalendiWordPressUtils();
	protected $error_text;// = "testing testing";
	protected $email_valid = FALSE;
	
	function kalendi_wordpress_options() {		
		$this->util = new KalendiWordPressUtils();
		$this->error_text = "testing testing";
		
		if(is_admin()) {		
			add_action('admin_menu', array(&$this, 'kalendi_create_menu'));
			
			
			if($this->checkFields()) {
				$this->process_option_update();
			}	
			
			$this->check_event_post();
					
			$this->import_posts();
		}
		
	}
	
	function kalendi_admin_scripts() {	
		//mlog("INCLUDING JQUERY JS STUFF");
		wp_enqueue_script( 'tiny_mce' );
		wp_enqueue_script( 'jquery' );		
		wp_enqueue_script( 'jquery-ui-datepicker', WP_PLUGIN_URL . '/kalendi-wordpress/javascripts/jquery-ui-1.7.3.custom.min.js', array('jquery'));
		wp_enqueue_script( 'jquery-validate', WP_PLUGIN_URL . '/kalendi-wordpress/javascripts/jquery.validate.js', array('jquery'));
		wp_enqueue_script( 'additional-methods', WP_PLUGIN_URL . '/kalendi-wordpress/javascripts/additional-methods.js', array('jquery', 'jquery-validate'));
		wp_enqueue_script( 'events-page', WP_PLUGIN_URL . '/kalendi-wordpress/javascripts/events-page.js', array('jquery', 'jquery-ui-datepicker'));
	}
	
	function kalendi_admin_styles() {	
		mlog("INCLUDING JQUERY STYLE STUFF");
		wp_enqueue_style( 'jquery-ui-lightness', WP_PLUGIN_URL . '/kalendi-wordpress/css/ui-lightness/jquery-ui-1.7.3.custom.css');
	}
	
	function check_event_post() {
		if($_POST['kalendi_event_posting'] == "true") {
			global $current_user;
      get_currentuserinfo();
			$user = $current_user;
		
			$username = get_option('kalendi_username');
			$password = get_option('kalendi_password');
			$eventID = $_POST['kalendi_event_id'];
			if(empty($eventID)) {
				// We need to add an event
				mlog("Adding a new event");
			
				$blog_name = get_bloginfo();
				$blog_url = get_bloginfo('url');
				$author = $user->user_email;
				$author_name = $user->first_name . " " . $user->last_name;
				if(empty($author_name) || $author_name == " ") {
					$author_name = "Unknown";
				}
			
				$custom_props = array(
					"wp author:$author",
					"wp blog url:$blog_url",
					"wp blog name:$blog_name",
					"wp author name:$author_name"
				);
				$custom_props = implode(",", $custom_props);
			
				// Collect the params
				$params = array(
					'caption' => $_POST['kalendi_event_caption'],
					'description' => $_POST['kalendi_event_description'],
					'allDay' => 'yes',
					'startDT' => $_POST['kalendi_event_date'],
					'customProp' => $custom_props,
					'location' => $_POST['kalendi_event_location'],
					'calendarID' => get_option('kalendi_calendar_id'),
					'visibility' => 'public',
					'userName' => $username,
					'password' => $password				
				);
			
				$content = $this->util->makeKalendiAPIPost('addEvent', $params);
			
				if(match($content, "success")) {
					wp_redirect(admin_url('admin.php?page=kalendi-events-menu-item&event-submitted=true'));				
				} else {			
					varlog($params, "Event not submitted, params:");
					varlog($content, "Event not submitted, result:");
					$xml = new SimpleXMLElement($content);
					$error_message = $xml->errorMesg;
					wp_redirect( admin_url( "admin.php?page=kalendi-events-menu-item&event-submitted=false&error-message=$error_message" ));
				}
			} else {
				// We need to edit the event
				varlog($_POST, "EDITING EVENT WITH THESE PARAMS");
				$eventID = $_POST['kalendi_event_id'];
				$date = $_POST['kalendi_event_date'];
				$caption = str_replace($search, $replace, $_POST['kalendi_event_caption']);
				$description = str_replace($search, $replace, $_POST['kalendi_event_description']);
				$location = str_replace($search, $replace, $_POST['kalendi_event_location']);
				$params = array(
					'eventID' => $eventID,
					'startDT' => $date,
					'caption' => $caption,
					'location' => $location,
					'description' => $description,
					'startTZ' => convert_timezone(get_option('timezone_string')),		
					'userName' => $username,
					'password' => $password
				);
				$content = $this->util->makeKalendiAPIPost("editEvent", $params);
				$message = "";
				if(match($content, "success")) {
					wp_redirect(admin_url('admin.php?page=kalendi-events-menu-item&event-submitted=true'));	
				} else {
					varlog($params, "Event not submitted, params:");
					varlog($content, "Event not submitted, result:");
					$xml = new SimpleXMLElement($content);
					$error_message = $xml->errorMesg;
					wp_redirect( admin_url( "admin.php?page=kalendi-events-menu-item&event-submitted=false&error-message=$error_message" ));
				}
			}			
		}
	}
	
	function edit_event_page() {
		$search = array("\\'");
		$replace = array("'");
		$username = get_option('kalendi_username');
		$password = get_option('kalendi_password');
		$calendarID = get_option('kalendi_calendar_id');
		$eventID = $_GET['eventID'];
		
		// Should be able to make a call like this, but for some reason the API isn't recognizing eventID
		// $params = array(
		// 	'eventID' => $_GET['eventID'],
		// 	'startDT' => '01-01-1900',
		// 	'userName' => $username,
		// 	'password' => $password
		// );
		// $event = $this->util->makeKalendiAPIPost("getEvents", $params);
		
		$params = array(
			'calendarID' => $calendarID,
			'eventID' => $eventID,
			'startDT' => '01-01-1900',
			'endDT' => '12-31-2100',
			'string' => '',
			'userName' => $username,
			'password' => $password
		);
		$events = $this->util->makeKalendiAPIPost("getEvents", $params);
		varlog($events, "RAW RESULT IN EDIT");
		$events = new SimpleXMLElement($events);
		$event = NULL;
		foreach($events as $tevent) {
			if($tevent->eventID == $eventID) $event = $tevent;
		}
		
		if(empty($event)) return;
		
		varlog($event, "OUR EVENT");

		$dateArr = explode("-", $event->date);
		varlog($dateArr, "DATEARR");
		$date = $dateArr[1] . "-" . $dateArr[2] . "-" . $dateArr[0];
		$caption = str_replace($search, $replace, $event->caption);
		$location = str_replace($search, $replace, $event->location);
		$description = str_replace($search, $replace, $event->description);
		?>
	        <style type="text/css">
                  .theEditor {background-color: #D0D0D0; }                                                         \
                </style>
				<table>
				<tr>
				<td valign="top">

				<div class="wrap">
		
				<form method="post" action="options.php" id="kalendi-events-form">
		
					<input type="hidden" name="kalendi_event_posting" value="true" />
					<input type="hidden" name="kalendi_event_id" value="<?php echo $eventID ?>" />
		
					<h2>Edit Event</h2>
			
					<p>
						Enter your event details below. Hit submit once you are done, and the event will be added to your calendar.
					</p>
			
					<table class="form-table">
						<tr valign="top">
							<th scope="row">
								Date (required)
							</th>
							<td>		
								<input type="text" class="required" name="kalendi_event_date" id="kalendi_event_date" value="<?php echo $date ?>" />
							</td>
						</tr>
						<tr valign="top">
							<th scope="row">
								Caption (required)
							</th>
							<td>		
								<input type="text" class="required" name="kalendi_event_caption" size="45" value="<?php echo $caption ?>" />
							</td>
						</tr>
						<tr valign="top">
							<th scope="row">
								Location
							</th>
							<td>		
								<input type="text" name="kalendi_event_location" size="45" value="<?php echo $location ?>" />
							</td>
						</tr>
						<tr valign="top">
							<th scope="row">
								Description
							</th>
							<td>		
							
<?php
                                   wp_tiny_mce( false , // true makes the editor "teeny"                                             
                                                array(
                                                      "editor_selector" => "kalendi_event_description"
                                                      )
                                                );
?>
				<textarea name="kalendi_event_description" class="kalendi_event_description" rows="10" cols="39"><?php echo $description ?></textarea>
							</td>
						</tr>
					</table>

					<p class="submit">
						<input type="submit" class="button-primary" value="<?php _e('Submit') ?>" />
					</p>
			
				</form>
				</div>
				</td>
				</tr>
				</table>
		<?php
	}
	
	function deleteEvent($eventID) {
		$username = get_option('kalendi_username');
		$password = get_option('kalendi_password');
		$params = array(			
			'eventID' => $eventID,
			'userName' => $username,
			'password' => $password
		);
		$content = $this->util->makeKalendiAPIPost("deleteEvent", $params);
	}
	
	function kalendi_events_page() {
		// First we need to get all events for this blog
		//varlog($_GET, "IN KALENDI EVENTS PAGE GET");
		if($_GET['action'] == 'edit') {
			// Here we edit the event
			$this->edit_event_page();
		} else {
			if($_GET['action'] == 'delete') $this->deleteEvent($_GET['eventID']);
			$params = array(
				'startDT' => '01-01-1900',
				'endDT' => '12-31-2100',
				'fields' => 'wp blog url',
				'string' => get_bloginfo('url')
			);
			$events = $this->util->makeKalendiAPIPost('getEvents', $params);
			varlog($events, "RawEvents");
			$events = new SimpleXMLElement($events);
			varlog($events, "Events");
			$submitted = isset($_GET['event-submitted']);
			$success = $_GET['event-submitted'] == "true";
			$message = $_GET['error-message'];
			?>
						
				<div class="wrap">
					<h2><?php _e('Kalendi Events'); ?></h2>
					
					
					<?php if($submitted && $success) { ?>
						<p style="color:green">Your event was submitted!</p>
					<?php } else if($submitted && !$success) { ?>
						<p style="color:red">There was an error submitting your event:<br/><?php echo $message ?></p>
					<?php } ?>
					
		
					
					<table class="widefat" cellspacing="0">
					<thead>
					<tr>
						<th scope="col" ><?php _e('Caption'); ?></th>
						<th scope="col" ><?php _e('Author'); ?></th>
						<th scope="col" ><?php _e('Date'); ?></th>
						<th scope="col" ><?php _e('Action'); ?></th>
					</tr>
					</thead>
					<tfoot>
					<tr>
						<th scope="col" ><?php _e('Caption'); ?></th>
						<th scope="col" ><?php _e('Author'); ?></th>
						<th scope="col" ><?php _e('Date'); ?></th>
						<th scope="col" ><?php _e('Action'); ?></th>
					</tr>
					</tfoot>            
					<tbody>
					<?php foreach($events->VEvent as $event) { 
						$postURL = $event->{'wp-post-url'};
						if(!empty($postURL)) continue;
						$eventID = $event->eventID;
						$edit_url = admin_url("admin.php?page=kalendi-events-menu-item&action=edit&eventID=$eventID");
						varlog($edit_url, "EDITURL");
					?>						
						<tr id="event-row-<?php echo $event->eventID; ?>">
							<td scope="row">
								<a href="<?php echo $edit_url ?>">
									<?php echo $event->caption ?>
								</a>
							</td>
							<td scope="row">
								<?php echo $event->{'wp-author'} ?>
							</td>
							<td scope="row">
								<?php echo $event->date ?>
							</td>
							<td scope="row">
								<a href="<?php echo $edit_url ?>">edit</a>
								|
								<a href="<?php echo admin_url("admin.php?page=kalendi-events-menu-item&action=delete&eventID=" . $event->eventID) ?>">delete</a>
							</td>
						</tr>
					<?php } ?>
					</tbody>
					</table>
				</div><?php
		}
	}
	
	function kalendi_add_events_page() {
		$date_string = date_i18n("m-d-Y");
		varlog($_GET, "GET IN EVENTS PAGE");
		?>
		
		<style type="text/css">
                  .theEditor {background-color: #D0D0D0; }                                                         \
                </style>
		<table>
		<tr>
		<td valign="top">

		<div class="wrap">
		
		<form method="post" action="options.php" id="kalendi-events-form">
		
			<input type="hidden" name="kalendi_event_posting" value="true" />
			
			<h2>Add an Event</h2>
			
			<p>
				Enter your event details below. Hit submit once you are done, and the event will be added to your calendar.
			</p>
			
			<table class="form-table">
				<tr valign="top">
					<th scope="row">
						Date (required)
					</th>
					<td>		
						<input type="text" class="required" name="kalendi_event_date" id="kalendi_event_date" value="<?php echo $date_string ?>" />
					</td>
				</tr>
				<tr valign="top">
					<th scope="row">
						Caption (required)
					</th>
					<td>		
						<input type="text" class="required" name="kalendi_event_caption" size="45" />
					</td>
				</tr>
				<tr valign="top">
					<th scope="row">
						Location
					</th>
					<td>		
						<input type="text" name="kalendi_event_location" size="45" />
					</td>
				</tr>
				<tr valign="top">
					<th scope="row">
						Description
					</th>
					<td>		
							
<?php
                                   wp_tiny_mce( false , // true makes the editor "teeny"                                             
                                                array(
                                                      "editor_selector" => "kalendi_event_description"
                                                      )
                                                );
?>
				<textarea name="kalendi_event_description" class="kalendi_event_description" rows="10" cols="39"><?php echo $description ?></textarea>
					</td>
				</tr>
			</table>

			<p class="submit">
				<input type="submit" class="button-primary" value="<?php _e('Submit') ?>" />
			</p>
			
		</form>
		</div>
		</td>
		</tr>
		</table>
			
		<?php
	}
	
	function account_complete() {
		// Is the account ready to go?
		$created = (boolean)get_option('kalendi_company_created');
		$activated = (boolean)get_option('kalendi_account_activated');
		$calendar_id = get_option('kalendi_calendar_id');
		$custom_props_created = (boolean)get_option('kalendi_custom_props_created2');
		
		return($created && $activated && $custom_props_created && !empty($calendar_id));
	}
	
	function import_posts() {		
		if($this->account_complete()) {
						
			$period = $_POST['kalendi_posts_to_fetch'];
			if($period == "1 week") {
				$date_string = date_i18n("m-d-Y", strtotime("-1 week"));
				$post_string = date_i18n("Y-m-d", strtotime("-1 week"));
			} else if($period == "1 month") {
				$date_string = date_i18n("m-d-Y", strtotime("-1 month"));
				$post_string = date_i18n("Y-m-d", strtotime("-1 month"));
			} else if($period == "6 months") {
				$date_string = date_i18n("m-d-Y", strtotime("-6 months"));
				$post_string = date_i18n("Y-m-d", strtotime("-6 months"));
			} else {
				return FALSE;
			}
			
			mlog("Our date: $date_string");
			
			$username = get_option('kalendi_username');
			$password = get_option('kalendi_password');
			
			// Lets getEvents up to the date specified
			$params = array(
				'userName' => $username,
				'password' => $password,
				'calendarID' => get_option('kalendi_calendar_id'),
				'startDT' => $date_string,
				'endDT' => date_i18n("m-d-Y", strtotime("+1 day"))
			);
			$events = $this->util->makeKalendiAPIPost('getEvents', $params);
			
			//varlog($events, "EVENTS");
			
			// Now we get the wordpress posts, back to the date specifed
			global $wpdb;
			//varlog($post_string, "POST STRING");
			$posts = $wpdb->get_results("SELECT * FROM wp_posts WHERE post_date > '$post_string' AND post_type = 'post' AND post_title != 'Auto Draft'");
			foreach($posts as $post) {
				$postid = (string)$post->ID;
				if(!match($events, $post->guid)) {
					mlog("submitting post $postid");
					$result = $this->util->submit_post($post, mysql2date('m-d-Y', $post->post_date));
					varlog($result, "Result from adding event $postid");
				}
			}
			
		}		
	}
	
	function process_option_update() {		
				
		$company_created = (boolean)get_option('kalendi_company_created');
		$activated = (boolean)get_option('kalendi_account_activated');
		varlog($activated, "ACTIVATED VALUE");
		
		$old_username = get_option('kalendi_username');
		$old_password = get_option('kalendi_password');
		$new_username = $_POST['kalendi_username'];
		$new_password = $_POST['kalendi_password'];
		$kalendi_reset = $_POST['kalendireset'];
                if ($kalendi_reset == 'yes') {
                  delete_options();
                  foreach ($_POST as $key => $value) {
                    if (strpos($key,"kalendi") == 0) {
                      unset($_POST[$key]);
                    }
                  }
                  return;
                }

		if(!$company_created) {
			update_option('kalendi_username', $_POST['kalendi_username']);
			update_option('kalendi_password', $_POST['kalendi_password']);
		} else if($activated) {
			mlog("ACTIVATED");
			mlog("olduname/newuname: $old_username/$new_username");
			mlog("oldpword/newpword: $old_password/$new_password");
			
			$result = $this->util->createCalendars();
			
			if($old_username != $new_username || $old_password != $new_password) {
				// We need to change the Kalendi info
				$params = array(
					'userName' => $old_username,
					'password' => $old_password,
					'newUserName' => $new_username,
					'newPassword' => $newPassword
				);
				$result = $this->util->makeKalendiAPIPost('changeUser', $params);
				varlog($result, "CHANGEUSER RESULT");
				if(match($result, "success")) {
					mlog("Account was changed");
					update_option('kalendi_account_activated', FALSE);
					update_option('kalendi_username', $_POST['kalendi_username']);
					update_option('kalendi_password', $_POST['kalendi_password']);				
				}	else {
					mlog("Account update FAILED");
				}
			}
		} 		
							
		if(!$company_created) {
			// Now we build the company
			$params = array(
				"companyName" => get_bloginfo('name'),
				"personFirstName" => "Empty",
				"personLastName" => "Empty",
				"phoneNumber" => "307-766-6177",
				"email" => $_POST['kalendi_username'],
				"userName" => $_POST['kalendi_username'],
				"password" => $_POST['kalendi_password']
			);
	
			$result = $this->util->makeKalendiAPIPost("createCompany", $params);
			varlog($result, "CREATE_COMPANY RESULT:");
			
			$success = match($result, "success");
			
			if(!$success) {
				$existing_email = match($result, "please choose another username/password");
				if($existing_email) {
					// Check to see if the account exists already...
					if(!$this->util->checkKalendiAccount()) {
						die("The username you provided is already in use, please choose another. If this is your email address for an existing account, please enter the correct password");
					} else {						
						update_option('kalendi_company_created', TRUE );
					}
				}
			} else {
				update_option('kalendi_company_created', TRUE );
			}			
		}
	}
	
	function checkFields() {
		if($_POST["kalendi_username"] == NULL || $_POST["kalendi_password"] == NULL) {
			return FALSE;
		}
				
		$email_valid = FALSE;
		$email = $_POST['kalendi_username'];
		varlog($email, "KALENDI EMAIL FROM POST");
		if(empty($email)) {
			$email_valid = TRUE;
		} else {
			if($this->util->check_email_address($email))
				$email_valid = TRUE;
			else {
				die("Invalid Email Address");
				return FALSE;
			}
		}
		return TRUE;
	}

	function kalendi_create_menu() {
		//create new top-level menu
		
		// update_option("kalendi_company_created", FALSE);
		// update_option("kalendi_account_activated", FALSE);
		// update_option("kalendi_calendar_id", NULL);
		// update_option("kalendi_custom_props_created2", FALSE);
		
		
		add_submenu_page('options-general.php', 'Kalendi Plugin Settings', 'Kalendi Settings', 'administrator', __FILE__, array(&$this, 'kalendi_settings_page') );

		//call register settings function
		add_action( 'admin_init', array(&$this, 'kalendi_register_mysettings') );
		
		if($this->account_complete()) {
			add_menu_page('Add Event', 'Events', 'publish_posts', 'kalendi-events-menu-item', array(&$this, 'kalendi_events_page'),plugins_url('/images/k_logo_16.png', __FILE__), 26);
			add_submenu_page('kalendi-events-menu-item', 'Add New Event', 'Add New', 'publish_posts', 'kalendi-add-new-event-menu-item', array(&$this, 'kalendi_add_events_page'));
		}
	}

	function kalendi_register_mysettings() {
		//register our settings
		register_setting( 'kalendi-settings-group', 'kalendi_watch_list' );
		register_setting( 'kalendi-settings-group', 'kalendi_username' );
		register_setting( 'kalendi-settings-group', 'kalendi_password' );
		register_setting( 'kalendi-settings-group', 'kalendi_posts_to_fetch' );
		
		register_setting( 'kalendi-hidden-settings-group', 'kalendi_company_created' );
		register_setting( 'kalendi-hidden-settings-group', 'kalendi_account_activated' );
		register_setting( 'kalendi-hidden-settings-group', 'kalendi_calendar_id' );
		register_setting( 'kalendi-hidden-settings-group', 'kalendi_custom_props_created2' );
		//register_setting( 'kalendi-hidden-settings-group', 'kalendi_timezoneid' );
		
	}

	function kalendi_settings_page() {
		$this->util->checkKalendiAccount();
	
		varlog(get_option('kalendi_company_created'), "COMPANY CREATED");
		
		$created = (boolean)get_option('kalendi_company_created');
		$activated = (boolean)get_option('kalendi_account_activated');
		$calendar_id = get_option('kalendi_calendar_id');
		$custom_props_created = (boolean)get_option('kalendi_custom_props_created2');
		
	?>
		<SCRIPT LANGUAGE="JavaScript">

		<!-- This script and many more are available free online at -->
		<!-- The JavaScript Source!! http://javascript.internet.com -->
		<!-- Original:  Caleb Larsen (caleb@mopedarmy.com) -->
		<!-- Web Site:  http://www.wmich.edu/apps/passmultiplevalues.html -->

		<!-- Begin
		
		function passText() {
		  
			oldvalue = jQuery('#kalendi_watch_list').val();
			var passedvalue = ""; 
			jQuery('#kalendi_blogs :selected').each(function(i, selected){ 
			  passedvalue = passedvalue + "\n" + jQuery(selected).val(); 
			});
		    var totalvalue = oldvalue+passedvalue;
		    jQuery('#kalendi_watch_list').val(totalvalue);
		    oldvalue = jQuery('#kalendi_watch_list').val();
		  
		}
		//  End -->
		</script>
		
		<table>
		<tr>
		<td valign="top">

		<div class="wrap">
		
		<form method="post" action="options.php">

		<?php settings_fields( 'kalendi-settings-group' ); ?>
		
		<h2>Kalendi Username/Password</h2>
		
			<?php if(!$created) { ?>			
			<p>
				Once you enter a password a Kalendi account will be created for you, this account will be a 30-day trial of Kalendi. An e-mail will be sent to you with an activation link. You must activate this account before we can enable Kalendi for WordPress.
			</p>
			<p>
				If you already have a Kalendi account, make sure your user e-mail address (above) is set to the Kalendi accounts e-mail, then enter your password for the existing Kalendi account.
			</p>
			<?php } else if(!$activated) { ?>
				<p style="color:red">
					You still need to activate your Kalendi account! Check your e-mail and click on the activation link.
				</p>
			<?php } else if(!empty($calendar_id) && $custom_props_created) { ?>
				<p style="color:green">
					Your Kalendi account is activated and ready to use!
				</p>
			<?php } else { ?>
				<p style="color:red">
					There was an error initializing your account, please make sure your username and password are correct.
				</p>
			<?php } ?>		
			<table class="form-table">
				<tr valign="top">
					<th scope="row">
						Kalendi Username (must be a valid e-mail address)
					</th>
					<td>		
						<input type="text" name="kalendi_username" value="<?php 
							$kName = get_option('kalendi_username');
							if(empty($kName)) $kName = get_bloginfo('admin_email');
							echo $kName; 
						?>" />
					</td>
				</tr>
				<tr valign="top">
					<th scope="row">
						Kalendi Password
					</th>
					<td>		
						<input type="password" name="kalendi_password" value="<?php echo get_option('kalendi_password') ?>" />
					</td>
				</tr>
			        <tr valign="top">
					<th scope="row">
						Reset Kalendi Data
					</th>
					<td>		
						Yes <input type="radio" name="kalendireset" value="yes"/> No <input type="radio" name="kalendireset" value="no" selected="yes"/>
					</td>
				</tr>
			</table>
		
		<h2>Kalendi for WordPress Options</h2>
		
		<p>
			With the Kalendi for WordPress plugin you can "watch" another WordPress blog. By doing this all their posts will show up in a list on your blogs front page. This is a great way to provide your blog viewers with additional content that you like.
		</p>
		<p>
			In order to "watch" a blog, simply enter the blog URL in the watch box below. Each entry should be on its own line.<br/><br/> Example: <br/><br/>
			www.myfavoriteblog.com/blog<br/>
			www.anotherblog.com/my_blog<br/>
			anotherfav.wordpress.com
		</p>

		<p>Watch List</p>
				
			   	<textarea rows="6" cols="40" id="kalendi_watch_list" name="kalendi_watch_list"><?php echo get_option('kalendi_watch_list') ?></textarea> 
				<p>Choose from these Kalendi user blogs and click the "Add to list" button to add them to your watch list. Select multiple items with CTRL+click.</p>
				<select multiple="multiple" size="10" id="kalendi_blogs" name="kalendi_blogs" style="height:150px;width:200px;">
				<?php
					$arr = array();
					$arr = $this->util->getWPCalendars();
					$options = get_option("kalendi_watch_list");
					foreach($arr as $i => $value){
						//echo "Array element ".$i.": ".$arr[$i]."<br>";
					
					 if ( in_array( $i, $options ))
					        echo "\n\t<option selected='selected' id='". $i . "' name='". $i . "' value='" . $i . "'>$value</option>";
					 else
					       	echo "\n\t<option id='". $i . "' name='". $i . "' value='" . $i . "'>$value</option>";

					 }
				?> 
					    
				</select> 
				<input type=button value="Add to list" onClick="passText();">
			
		
		<h2>Import Posts Options</h2>
		
		<p>
			Kalendi for WordPress will go through your older posts up to a certain date and store them on the Kalendi servers for you. Please specify how far back you would like Kalendi for WordPress to check.
		</p>
		<table class="form-table">
			<tr valign="top">
				<th scope="row">
					Fetch posts from the past:
				</th>
				<td>	
					<?php $fetch = get_option('kalendi_posts_to_fetch') ?>
					<select name="kalendi_posts_to_fetch" id="kalendi_posts_to_fetch">
						<option value="1 week" <?php if($fetch == "1 week") echo 'selected="selected"' ?> >1 week</option>	
						<option value="1 month" <?php if($fetch == "1 month") echo 'selected="selected"' ?> >1 month</option>
						<option value="6 months" <?php if($fetch == "6 months") echo 'selected="selected"' ?> >6 months</option>
					</select>
				</td>
			</tr>
		</table>
		
		

		<p class="submit">
		<input type="submit" class="button-primary" value="<?php _e('Submit') ?>" />
		</p>

		</form>
		</div>

		</td>

		</tr>
		</table>
		<?php 
	} 
}

/* Initialise ourselves */
global $kalendi_wordpress_options_instance; 
$kalendi_wordpress_options_instance = new kalendi_wordpress_options();
add_action('admin_print_scripts', array(&$kalendi_wordpress_options_instance, 'kalendi_admin_scripts'));
add_action('admin_print_styles', array(&$kalendi_wordpress_options_instance, 'kalendi_admin_styles'));
?>