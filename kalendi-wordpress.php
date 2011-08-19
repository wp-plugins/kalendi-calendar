<?php
/*
Plugin Name: Kalendi for WordPress
Plugin URI: http://www.kalendi.com
Version: v1.10
Author: Happy Jack Software
Description: Integrates Kalendi with WordPress for blog calendaring.
*/

include('php/config.php');

mlog(get_bloginfo("wpurl"));

class KalendiWordPress {
	
	protected $util;

	function KalendiWordPress() { //constructor
		$this->util = new KalendiWordPressUtils();
		// Actions and Filters   

		// add_action('wp_head', array(&$calwp, 'addHeaders'), 1);
		// add_action('wp_meta', array(&$calwp, 'sidebarContent'), 1);
		add_action('publish_post', array(&$this, 'checkPostData'), 1);
	
		include('kalendi-options.php');
		include('kalendi-widget.php');	
	}
	
	function checkPostData($postID) {
		// TODO: make everything dynamic from admin config options here
		// First we get the post being updated
		$post = get_post($postID);
		varlog($post, "POST DETAILS:");
		$user = get_userdata($post->post_author);
		
		$calID = get_option('kalendi_calendar_id');
		$activated = get_option('kalendi_account_activated');
		if (!$activated) {
                  if (!$this->util->checkKalendiAccount()) return;
                  $calID = get_option('kalendi_calendar_id');
                  $activated = get_option('kalendi_account_activated');
		  global $kalendi_wordpress_options_instance;
		  $kalendi_wordpress_options_instance->import_posts();
                }

		if(empty($calID) || !$activated)
			return;
			
		$username = get_option('kalendi_username');
		$password = get_option('kalendi_password');
				
		// Now check the getEvents list for a post with this same GUID
		$params = array(
			'calendarID' => get_option('kalendi_calendar_id'),
			'startDT' => date_i18n("m-d-Y"),
			'string' => $this->util->getPostGUID($post),
			'fields' => 'wp post url',
			'userName' => $username,
			'password' => $password
		);
		//varlog($params, "GetEvents API Call Params:");
		$content = $this->util->makeKalendiAPIPost("getEvents", $params);
		
		//varlog($content, "GetEvents API Call Return:");		
		$found = strpos($content, "<eventID>");
		//varlog($found, "Found variable: ");
		if($found === FALSE) {
			// Add the event
			$content = $this->util->submit_post($post);
			varlog($content, "AddEvent Response:");
		} else {
			// Edit the event			
			$xml = new SimpleXMLElement($content);
			//varlog($xml, "Our Slick XML object");
			$eventID = (string)$xml->VEvent[0]->eventID;
			$date = $post->post_modified;
			$caption = $post->post_title;
                        $description = $post->post_content;
			$post_url = $post->guid;
			$params = array(
				'eventID' => $eventID,
				'startDT' => date_i18n("m-d-Y"),
				//'startHour' => date_i18n("H"),
				//'startMinute' => date_i18n("i"),
				'customProp' => 'wp post url:$post_url',
	                        'caption' => $caption,
                                'location' => $location,
                                'description' => $description,
				'userName' => $username,
				'password' => $password		
			);
			//varlog($params, "Edit Event Params:");
			$content = $this->util->makeKalendiAPIPost("editEvent", $params);
			//varlog($content, "Edit Event Result:");
		}
	}	
}


add_action('plugins_loaded', 'load_kalendi_for_wordpress_plugin');

function load_kalendi_for_wordpress_plugin() {
	$calwp = new KalendiWordPress();
}


?>