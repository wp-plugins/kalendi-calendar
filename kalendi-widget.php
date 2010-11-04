<?php

class Kalendi_Widget extends WP_Widget {
	
	function Kalendi_Widget()	{
		// Widget Constructor
		parent::WP_Widget(false, $name = 'Kalendi Widget');	
		add_action('wp_head', array(&$this, 'add_widget_headers'));
	}
	
	function add_widget_headers() {
		$options = get_option("widget_kalendi_widget");
		$options = $options[$this->number];
		KalendiWordPressUtils::load_scripts();
		KalendiWordPressUtils::styles($options['color1'], $options['color2'], $options['color3']);
	}

	function form($instance) {		
		$title = esc_attr($instance['title']);
		$color1 = esc_attr($instance['color1']);
		$color2 = esc_attr($instance['color2']);
		$color3 = esc_attr($instance['color3']);
		?>
			<p><label for="<?php echo $this->get_field_id('title'); ?>"><?php _e('Title:'); ?> <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" name="<?php echo $this->get_field_name('title'); ?>" type="text" value="<?php echo $title; ?>" /></label></p>
			<div id="colorpicker1"></div>
			<p><label for="<?php echo $this->get_field_id('color1'); ?>"><?php _e('Dark Color:'); ?> <input class="widefat kalendi_color1" id="<?php echo $this->get_field_id('color1'); ?>" name="<?php echo $this->get_field_name('color1'); ?>" type="text" value="<?php echo $color1; ?>" /></label></p>
			<div id="colorpicker2"></div>
			<p><label for="<?php echo $this->get_field_id('color2'); ?>"><?php _e('Middle Color:'); ?> <input class="widefat kalendi_color2" id="<?php echo $this->get_field_id('color2'); ?>" name="<?php echo $this->get_field_name('color2'); ?>" type="text" value="<?php echo $color2; ?>" /></label></p>
			<div id="colorpicker3"></div>
			<p><label for="<?php echo $this->get_field_id('color3'); ?>"><?php _e('Light Color:'); ?> <input class="widefat kalendi_color3" id="<?php echo $this->get_field_id('color3'); ?>" name="<?php echo $this->get_field_name('color3'); ?>" type="text" value="<?php echo $color3; ?>" /></label></p>
		<?php 
	}

	function update($new_instance, $old_instance) {				
		$instance = $old_instance;
		$instance['title'] = strip_tags($new_instance['title']);
		$instance['color1'] = strip_tags($new_instance['color1']);
		$instance['color2'] = strip_tags($new_instance['color2']);
		$instance['color3'] = strip_tags($new_instance['color3']);		
    return $instance;
	}

	function widget($args, $instance) {
		// outputs the content of the widget
		extract( $args );
    $title = apply_filters('widget_title', $instance['title']);
		echo $before_widget; 
		if ( $title )
    echo $before_title . $title . $after_title;
    KalendiWordPressUtils::sidebar_content();
    echo $after_widget; 
	}

}

/* Initialise ourselves */
//add_action('plugins_loaded', create_function('','global $kalendi_widget_instance; $kalendi_widget_instance = new kalendi_widget();'));
// register FooWidget widget
add_action('widgets_init', 'register_kalendi_widget');

function register_kalendi_widget() {	
	register_widget("Kalendi_Widget");
	//add_action( 'admin_print_scripts', 'kalendi_widget_admin_header' );
	//add_action( 'admin_print_styles', 'kalendi_widget_admin_style' );
}

function kalendi_widget_admin_header() {
	wp_enqueue_script( 'jquery' );
	wp_enqueue_script( 'farbtastic' );
	wp_enqueue_script( 'kalendi_widget_admin', WP_PLUGIN_URL . '/kalendi-calendar/javascripts/kalendi_widget_admin.js', array('jquery', 'farbtastic'));
}

function kalendi_widget_admin_style() {	
	wp_enqueue_style( 'farbtastic' );
}

?>