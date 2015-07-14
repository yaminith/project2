/*globals $ Recaptcha log*/
/**
 * Captcha related functionality encapsulated in Captcha object
 */

function Captcha(ptemplateName, pparentDivDomID, perrorDivDomID) {
	this.templateName = ptemplateName;
	this.parentDivDomID = pparentDivDomID;
	this.errorDivDomID = perrorDivDomID;
	this.isEnabled = false;
}

Captcha.prototype.show = function () {
	// STEP 1: Get Captcha properties using AJAX call
	// STEP 2: Add the necessary html elements to page DOM under parentDov
	// STEP 3: Invoke Recpatcha.create() with custom theme, public key
	// parameters required
	var captchaPublicKey = "";
	var myObj = this;
	$.ajax({
		type : "GET",
		async : true,
		// url : atmoconsolehomemetadata.getAtmosphereAPIRootEndpoint() +
		// "/captcha/properties",
		url : "/api/captcha/properties",
		contentType : 'application/json',
		dataType : 'json',
		success : function (response, textStatus, jqXHR) {
			// STEP 2: add token to state
			// alert(data.enabled);
			if (response.enabled) {
				myObj.isEnabled = true;
				// alert(myObj.templateName+":"+myObj.parentDivDomID);
				$("#" + myObj.templateName).tmpl().appendTo(
						"#" + myObj.parentDivDomID);
				captchaPublicKey = response.publickey;
				if (captchaPublicKey) {
					setTimeout(
							function() {
								Recaptcha.create(captchaPublicKey, myObj.parentDivDomID,
								    {
								      theme: "custom",
								      custom_theme_widget : myObj.parentDivDomID,
								      callback: logger.info("Recaptcha image loaded.")
		
								    }
								);
							}, 1000);
				} else {
					myObj.showError("Public key is not defined for Captcha");
				}
			}

		},

		error : function (response, textStatus, jqXHR) {
			// alert("validate failure:"+textStatus);
			// alert(submitUrl + ":::::" + data)
			myObj.showError(response.responseText);
		}

	});

};

Captcha.prototype.validate = function (callbackFn, errorCallbackFn, callbackData) {
	var challenge = Recaptcha.get_challenge();
	var response = Recaptcha.get_response();
	var data = "challenge=" + challenge + "&response=" + response;
	var submitUrl = "/api/captcha/validate";
	var myObj = this;
	$.ajax({
		type : "POST",
		url : submitUrl,
		dataType : "json",
		async:false,
		contentType : 'application/x-www-form-urlencoded',
		data : data,
		success : function (response, textStatus, jqXHR) {
			if (response.statusCode == 'FAILURE') {
				var mappedError = myObj.mapError(response.statusMessage);
				errorCallbackFn(mappedError);
			} else {
				callbackFn(callbackData);
			}
		},
		error : function (response, textStatus, jqXHR) {
			// alert("validate failure:"+textStatus);
			// alert(submitUrl + ":::::" + data)
			errorCallbackFn(response.statusMessage);
		}
	});
};

Captcha.prototype.mapError = function (error) {
	// prepend with standard property format
	var outError = 'com.soa.atmosphere.signup.';
	//Remove hyphens from error and replace with underscore
	var plainError = error.replace(/-/g, "_");
	return outError+plainError;
	
};

Captcha.prototype.showError = function (errorMessage) {
	$("#" + this.errorDivDomID).text(errorMessage).addClass("error");
};

Captcha.prototype.clearError = function () {
	$("#" + this.errorDivDomID).text("").removeClass("error");
};

Captcha.prototype.isEnabled = function () {
	return this.isEnabled;
};

Captcha.prototype.validateField = function (captchaResponseFieldID) {
	try {
		var fieldObject = $('#' + captchaResponseFieldID);
		fieldObject.focus(function() {
			if (fieldObject.val() == 'This field is required.') {
				fieldObject.val('');
			}
		});
		if (fieldObject.val() == '' || fieldObject.val() == 'This field is required.') {
			fieldObject.addClass("error");
			return false;
		} else {
			return true;
		}
	} catch (e){
		logger.error(e);
	}
};
