jQuery(document).ready(function(){
	var input = jQuery('#kalendi_event_date');
	if(input != null)	input.datepicker({dateFormat: 'mm-dd-yy' });
	
	var form = jQuery('#kalendi-events-form');
	if(form != null) form.validate();
});