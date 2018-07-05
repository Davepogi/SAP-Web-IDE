jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"costchangeapproval/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"costchangeapproval/test/integration/pages/App",
	"costchangeapproval/test/integration/pages/Browser",
	"costchangeapproval/test/integration/pages/Master",
	"costchangeapproval/test/integration/pages/Detail",
	"costchangeapproval/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "costchangeapproval.view."
	});

	sap.ui.require([
		"costchangeapproval/test/integration/NavigationJourneyPhone",
		"costchangeapproval/test/integration/NotFoundJourneyPhone",
		"costchangeapproval/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});