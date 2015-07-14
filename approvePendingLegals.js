 
function ApprovePendingLegals(){
	this.appId = opts.data.appId;
	this.appVersionId = opts.data.appVersionId;
	// this.legals = this.checkForLegals;
	this.apiId = opts.data.apiId || '';
	this.template = opts.template;
	this.showLegals = this.displayLegals;
	this.currentIndex = -1;
	this.callBackHandler = callBackHandler || function() {
	};
	this.links = [];
	this.guidToLinks = [];
	this.agreementDocs = [];
	this.legalsLinksRetrieved = true;
	this.postAgreementStatus = '';
	this.data = {};
	this.layout = null;
	this.processedLegalsCount = 0;
	this.isPreviousContractRequestCompleted = true; // used in submit create contract callback
	this.apiVersions = [];
	this.totalPendingLegalsCount = 0;
	this.obj = {};
	this.obj.objectType = "myapps";
	this.obj.objectId = this.appId;
	this.obj.viewName = "reqprodaccess";
	this.obj.objectVersionId = this.appVersionId;
	this.bindActions();
	this.findPendingLegals();
	var selfObj = this;
	var inputData = {};
	if (selfObj.apiId) {
		inputData = {
			"ApiVersionDN" : selfObj.apiId,
			"State" : "com.soa.app.apilegal.pending"
		};
	} else {
		inputData = {
			"State" : "com.soa.app.apilegal.pending"
		};
	}
	$.ajax({
		url : atmometadata.getAppsAPIEndpoint(new FDN(this.appVersionId).getFederationMemberId()) + "/versions/" + this.appVersionId + "/apilegals",
		async : true,
		type : "GET",
		data : inputData,
		dataType : "json",
		success : function(data) {
			if (data.channel.item) {
				for ( var i = 0; i < data.channel.item.length; i++) {
					selfObj.links[i] = atmometadata.getContentAPIEndpoint(new FDN(this.appVersionId)) + (data.channel.item[i].link.charAt(0) == '/' ? "" : "/") + data.channel.item[i].link;
					selfObj.guidToLinks[i] = data.channel.item[i].guid.value;
					selfObj.agreementDocs[i] = data.channel.item[i].guid.value;
				}
				selfObj.totalPendingLegalsCount = (selfObj.totalPendingLegalsCount + data.channel.item.length);

			}
			selfObj.showLegals();
		}
	});

 
	var selfObj = this;
	selfObj.isPreviousContractRequestCompleted = true;
	$("#myAppsRequestAPISave").live("click", function(event) {
		event.preventDefault();
		var link = $("#legalPrintSaveButtons").attr("link");
		var guidToLink = $("#legalPrintSaveButtons").attr("documentGuid");
		selfObj.printOrSave(guidToLink, 'save');
	});
	$("button[action=activateNextLegal]").live("click", function() {
		if ($(this).attr("page") === "third") {
			$("#legalAgreementsHead").addClass("inactiveTab").removeClass("activeTab");
		}
		$("#selectAPIsHead").removeClass("activeTab").addClass("inactiveTab");
		$("#selectAPIsHead").attr("disabled", true);
		if ((selfObj.currentIndex + 1) < selfObj.totalPendingLegalsCount) {
			selfObj.setLinks(false);
		} else {
			selfObj.prepareSubmitCreateContractRequest();
		}

	});
	$("div#legalAgreements a").live("click", function(event) {
		event.preventDefault();
		selfObj.setLinks(true);
	});
	$("#myAppsRequestAPIPrint").live("click", function(event) {
		event.preventDefault();
		var link = $("#legalPrintSaveButtons").attr("link");
		var guidToLink = $("#legalPrintSaveButtons").attr("documentGuid");
		window.open("#/home/printlegals?" + guidToLink);
	});
	$("#cancelRequestAPINL").live("click", function() {
		selfObj.closeDialog();

	});
 
	$.ajax({
		type : 'GET',
		url : atmometadata.getLegalsAPIEndpoint(new FDN(documentID)) + "/" + documentID,
		async : true,
		dataType : 'json',
		success : function(data, responseText, jqXHR) {
			var printSaveLink = data.PrintContentPath;
			if (printOrSave == 'print') {
				window.open(atmometadata.getContentAPIEndpoint(new FDN(documentID)) + "/" + printSaveLink);
			} else {
				if (printSaveLink.indexOf("?") == -1) {
					window.open(atmometadata.getContentAPIEndpoint(new FDN(documentID)) + "/"+ printSaveLink + "?download=true");
				} else {
					window.open(atmometadata.getContentAPIEndpoint(new FDN(documentID)) + "/" + printSaveLink + "&download=true");
				}
			}
		},
		error : function(data, textStatus, errorThrown) {
			alert('Error retrieving the agreement document for printing/saving');
		}
	});

};
ApprovePendingLegals.prototype.displayLegals = function() {
	var selfObj = this;
	this.getLegalsLinks();

	setTimeout(function() {
		selfObj.renderLegalsPage();
	}, 500);
	
	$.tmpl(this.template, this.data).appendTo("#legalsDisplay");
	$(".ui-dialog-titlebar").hide();

};

ApprovePendingLegals.prototype.getLegalsLinks = function() {
	var selfObj = this;
	if (this.totalPendingLegalsCount > 0) {
		this.createDialog(610, 500, true);
	} else {

		updatePageLayout(selfObj.obj);
	}

};

ApprovePendingLegals.prototype.renderLegalsPage = function() {
	var selfObj = this;
	if (this.legalsLinksRetrieved) {
		this.legalsLinksRetrieved = false;
		selfObj.setLinks(false);
	}
};

ApprovePendingLegals.prototype.prepareSubmitCreateContractRequest = function() {
	var selfObj = this;
	if (this.totalPendingLegalsCount > 0) {
		selfObj.isPreviousContractRequestCompleted = false;
		selfObj.postLegalAgreements();
	}
};

ApprovePendingLegals.prototype.setLinks = function(prevLink) {
	var links = this.links;
	var guidToLinks = this.guidToLinks;
	if (prevLink) {
		this.currentIndex--;
	} else if (this.currentIndex >= 0) {
		this.currentIndex++;
	} else {
		this.currentIndex = 0;
	}
	if (links && this.currentIndex < links.length + 1) {
		this.getLegals(links[this.currentIndex], guidToLinks[this.currentIndex]);
		this.activateNextButton();
		var reviewText = 'Please review the License Agreement below (' + (this.currentIndex + 1) + ' of ' + links.length + ')';
		$(".selectapistext").html('Please review the Legal Agreement below.<div> The I AGREE button will activate once you scroll to the bottom.</div>');
		if (this.currentIndex == 0) {
			$("div#legalAgreements a").hide();
		} else {
			$("div#legalAgreements a").show();
		}
	}
	for ( var i = 0; i < this.totalPendingLegalsCount; i++) {

		if (links && links.length > 0) {
			$("#legalAgreements").show();
			$("#legalAgreementsHead").addClass("activeTab").removeClass("inactiveTab");
			$("#selectAPIsHead").removeClass("activeTab").addClass("inactiveTab");
			$("#legalsButtons").show();
			$("#statusDialog").hide();
			$("#legalAgreementsHead").removeAttr("disabled");
		}

		return false;
	}

};

ApprovePendingLegals.prototype.postLegalAgreements = function() {
	this.postAgreementStatus = 'STARTED';
	var selfObj = this;
	for ( var j = 0; selfObj.agreementDocs && j < selfObj.agreementDocs.length; j++) {
		var jsonObj = {};
		jsonObj.DocumentID = selfObj.agreementDocs[j];
		// jsonObj["UserID"] = login.userFDN();
		jsonObj.AgreementScopeID = selfObj.appVersionId;
		$.ajax({
			type : "POST",
			url : atmometadata.getLegalsAPIEndpoint(new FDN(selfObj.appVersionId)) + "/agreements",
			dataType : "text",
			async : true,
			contentType : 'application/json',
			data : JSON.stringify(jsonObj),
			success : function(response, textStatus, jqXHR) {
				// alert('agreement accepted. count='+myAppsRequestAPIAccessWidget.processedLegalsCount);
				selfObj.closeDialog();
				updatePageLayout(selfObj.obj);
				selfObj.processedLegalsCount = selfObj.processedLegalsCount + 1;
			},
			error : function(data, textStatus, errorThrown) {
				alert('error posting acceptance agreement');
			}
		});
	}

};

ApprovePendingLegals.prototype.activateNextButton = function() {
	var links = this.links;
	if (links && (this.currentIndex + 1) < links.length) {
		$("button[action=activateNextLegal]").html('I AGREE');
		$("button[action=activateNextLegal]").attr("page", "third");
	} else {
		$("button[action=activateNextLegal]").html('I AGREE');
		$("button[action=activateNextLegal]").removeAttr("page");
	}

};

ApprovePendingLegals.prototype.getLegals = function(link, guidToLink) {
	$.ajax({
		type : "GET",
		url : link,
		async : true,
		dataType : "html",
		success : function(data) {
			$("#legalPrintSaveButtons").attr("link", link); // store link on the page so we can open it later
			$("#legalPrintSaveButtons").attr("documentGuid", guidToLink);
			// console.log('guidToLink='+guidToLink);
			$("#contentPageThree").empty(); // empty first, in case of multiples
			$("#myAppsRequestAPIAgreeButton").removeClass("button_disabled"); // make sure we start enabled
			$("#myAppsRequestAPIAgreeButton").attr("disabled", false);
			// $("#contentPageThree").prepend(data).scrollTop($("#contentPageThree").offset().top - 400); //make sure we start at the top every time
			$("#contentPageThree").prepend(data).scrollTop(0); // make sure we start at the top every time
			// if document goes beyond height of content div, then disable agree button and only enable
			// when they reach (scroll to) the bottom; otherwise, buttons are already enabled
			/*
			 * if ($('#contentPageThree').outerHeight() < $('#contentPageThree')[0].scrollHeight) { $("#contentPageThree").append('<div id="myAppsRequestAPIScrollcheck"></div>'); //add something to
			 * check against $("#myAppsRequestAPIAgreeButton").attr("disabled",true); $("#myAppsRequestAPIAgreeButton").addClass("button_disabled"); $("#contentPageThree").scroll(function(){ var yPos =
			 * ($("#myAppsRequestAPIScrollcheck").offset()).top + ($("#myAppsRequestAPIScrollcheck").outerHeight()) , boxTop = ($(this).offset()).top , boxBottom = boxTop + $(this).outerHeight() + 20
			 * //pad it, or it won't get enabled ; if (yPos < boxBottom){//about the height for the agree button to come into view $("#myAppsRequestAPIAgreeButton").removeClass("button_disabled");
			 * $("#myAppsRequestAPIAgreeButton").attr("disabled",false); } }); }
			 */
		},
		error : function(data) {
			alert('Error retrieving legal agreement: ' + data.responseText);
		}
	});

};

ApprovePendingLegals.prototype.createDialog = function(width, height, isModal) {
	this.layout = $('<div id="legalsDisplay"></div>');
	var dwidth = (($(window).width() - width) / 2) + 1;
	var dheight = (($(window).height() - height) / 2) + 50;
	$(this.layout).dialog({
		width : width,
		height : 'auto',
		dialogClass : 'executeAction',
		modal : isModal,
		position : [ dwidth, dheight ]
	});
};

ApprovePendingLegals.prototype.closeDialog = function() {
	this.currentIndex = -1;
	$("#legalsDisplay").dialog("destroy").remove();
};