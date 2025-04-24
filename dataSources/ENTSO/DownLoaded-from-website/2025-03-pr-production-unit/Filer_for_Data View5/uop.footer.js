

$(document).ready(function() {
	
	$('#help-page').attr("href",baseUrl + "/content/static_content/Static%20content/knowledge base/knowledge base.html");

    var sitemapType = (typeof isAdmin !== 'undefined' && isAdmin === "true") ? "adm":"pub";
	$('#sitemap').attr("href", baseUrl + "/content/static_content/Static%20content/sitemap/Sitemap-"+sitemapType+".html");
	
	$('#glossary').attr("href", "https://www.entsoe.eu/data/data-portal/glossary/");
	
	$('#about').attr("href", "https://www.entsoe.eu/about-entso-e/");
	
	$('#contact').attr("href",baseUrl + "/content/static_content/Static%20content/contact%20us/Contact%20Us.html");
	
	$('#new-users').attr("href",baseUrl + "/content/static_content/Static%20content/new%20users/new%20users.html");

	$('#registered-users').attr("href",baseUrl + "/content/static_content/Static%20content/registered%20users/registered%20users.html");

	$('#disclaimer').attr("href",baseUrl + "/content/static_content/Static%20content/terms%20and%20conditions/terms%20and%20conditions.html");

	$('#footer-faq').attr("href", baseUrl + "/content/static_content/Static%20content/faq/FAQ.html");

	if(typeof isLogged !== "undefined") {
		if(isLogged === "" || isLogged == null) {
			$('#login').attr("href", "#");
			$('#login').text("Login");
		}
		else {
			$('#login').attr("href",baseUrl + "/j_spring_security_logout");
			$('#login').text("Log out");
		}
		
		$('#login').click(function(event) {		
			var loginText = $('#login').text();
			if(loginText === "Login") {
				$('#login-dialog').trigger('click');
				event.preventDefault();
			}
		});
	}
});


