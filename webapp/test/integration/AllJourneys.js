jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 CostHdrSet in the list
// * All 3 CostHdrSet have at least one ToCostDtlSet

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
		"costchangeapproval/test/integration/MasterJourney",
		"costchangeapproval/test/integration/NavigationJourney",
		"costchangeapproval/test/integration/NotFoundJourney",
		"costchangeapproval/test/integration/BusyJourney",
		"costchangeapproval/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});