sap.ui.define([], function() {
	"use strict";

	//Initialize NumberFormat instance
	jQuery.sap.require("sap.ui.core.format.NumberFormat");
	var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
		maxFractionDigits: 2,
		groupingEnabled: true,
		groupingSeparator: ",",
		decimalSeparator: "."
	});

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			
			return (oNumberFormat.format(sValue));
			
		},
		
		//Formats time to "h:mm a" Ex) 8:30 PM
		formatTime: function(time) {
			var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "h:mm a"
			});
			var timeStr;
			if (time === null) {
				timeStr = "";
			} else {
				timeStr = timeFormat.format(new Date(time.ms));
			}
			return timeStr;
		},

		//Resets ValueState
		getStateByPropertyValue: function(property) {
			return sap.ui.core.ValueState.None;

		}		
		
	};

});