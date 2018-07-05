/*global location */
/*eslint-disable no-console, no-alert, sap-no-location-reload */
sap.ui.define([
	"costchangeapproval/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"costchangeapproval/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("costchangeapproval.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			//For dynamic column output
			var oViewModel2 = new sap.ui.model.json.JSONModel({
				bHideColumnOutright: true,
				bHideColumnConcess: true,
				bColumnTitleGC: "Gross Cost"
			});
			this.getView().setModel(oViewModel2, "viewProperties");

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onSelectionChange: function(oEvent) {

			var row,
				oTable = this.byId("lineItemsList"),
				oModelItems = oTable.getModel(),
				aItems = oTable.getItems();

			//Clear ZCOMMENT value states for selected items and unselected items with comments
			for (row = 0; row < aItems.length; row++) {

				if (aItems[row].getSelected()) {

					aItems[row].getCells()[0].getItems()[2].setValueState(sap.ui.core.ValueState.None);

				} else {

					if (oModelItems.getProperty("Zcomment", aItems[row].getBindingContext()) !== "") {

						aItems[row].getCells()[0].getItems()[2].setValueState(sap.ui.core.ValueState.None);

					}
				}
			}
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
					//Set amount formatting
					this._setAmountFormats();
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		// __buttonApprove
		onPressApprove: function(oEvent) {

			var self = this;

			//Confirmation popup
			jQuery.sap.require("sap.m.MessageBox");
			sap.m.MessageBox.show(
				"Approve price change?", {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: "Approve",
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							//Execute approval
							self._executeApproval(oEvent);
						}
					}
				}
			);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("CostHdrSet", {
					WiId: sObjectId
				});
				this._bindView("/" + sObjectPath);
 
				//Hide columns based on article type
				var bindingContextH = this.byId("objectHeader").getBindingContext();
				var oViewModel = this.getView().getModel("viewProperties");

				if (bindingContextH.getProperty("Artype") === "CONCESS") {
					//Concess
					oViewModel.setProperty("/bHideColumnConcess", true);
					oViewModel.setProperty("/bHideColumnOutright", false);
					oViewModel.setProperty("/bColumnTitleGC", "SRP in Inforecord");
				} else {
					//Outright, Consign
					oViewModel.setProperty("/bHideColumnConcess", false);
					oViewModel.setProperty("/bHideColumnOutright", true);
					oViewModel.setProperty("/bColumnTitleGC", "Gross Cost");
				}

				//Reset value-states
				this._clearErrorCells();

			}.bind(this));

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.WiId,
				sObjectName = oObject.WiText,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Execute approval of work item
		 */
		_executeApproval: function(oEvent) {

			//Create Request Model
			var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZMM_COSTCHANGE_SRV/");

			//Create Header for Deep Entity
			var request = {};
			var bindingContextH = this.byId("objectHeader").getBindingContext();

			request.WiId = bindingContextH.getProperty("WiId");

			//Create Detail
			var ToCostDtlSet = [];

			var row,
				oTable = this.byId("lineItemsList"),
				oModelItems = oTable.getModel(),
				aItems = oTable.getItems(),
				zstatus;

			for (row = 0; row < aItems.length; row++) {
				// Check if item is selected
				if (aItems[row].getSelected()) {
					zstatus = "2"; //approved status
				} else {
					zstatus = "3"; //rejected status

					//Require comments for rejected items and set focus to 1st one
					if (oModelItems.getProperty("Zcomment", aItems[row].getBindingContext()) === "") {
						setTimeout(function() {
							//Set vbox->text area's valuestate to Error 
							aItems[row].getCells()[0].getItems()[2].setValueState(sap.ui.core.ValueState.Error);
							aItems[row].getCells()[0].getItems()[2].focus();

						}, 300);
						return;
					}
				}

				ToCostDtlSet.push({
					WiId: oModelItems.getProperty("WiId", aItems[row].getBindingContext()),
					Matnr: oModelItems.getProperty("Matnr", aItems[row].getBindingContext()),
					Werks: oModelItems.getProperty("Werks", aItems[row].getBindingContext()),
					Meins: oModelItems.getProperty("Meins", aItems[row].getBindingContext()),
					Zstatus: zstatus,
					Zcomment: oModelItems.getProperty("Zcomment", aItems[row].getBindingContext())
				});
			}

			//Create Result
			var ToResult = [];
			ToResult.push({
				MSG1: '',
				MSG2: ''
			});

			//Add subtables to request
			request.ToCostDtlSet = ToCostDtlSet;
			request.ToResult  = ToResult;

			//Call oData create deep entity
			oModel.create("/CostHdrSet",
				request,
				null,
				function(oData, oResponse) {

					//Check return values
					var oODataJSONModel = new sap.ui.model.json.JSONModel();
					oODataJSONModel.setData(oData);

					if (oODataJSONModel.getProperty("/ToResult/results/0/MSG1") === "S") {
						//Display success message
						sap.m.MessageToast.show(oODataJSONModel.getProperty("/ToResult/results/0/MSG2"));
						oModelItems.refresh(true);

						//Trigger master event to select 1st item
						var oEventBus = sap.ui.getCore().getEventBus();
						oEventBus.publish("Detail", "selectFirstItemAfter");

					} else {
						//Display error message
						jQuery.sap.require("sap.m.MessageBox");
						sap.m.MessageBox.show(
							oODataJSONModel.getProperty("/ToResult/results/0/MSG2"), {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								onClose: function(oAction) {

								}
							}
						);
						if (oODataJSONModel.getProperty("/ToResult/results/0/MSG2") === "Work item has already been processed") {
							oModelItems.refresh(true);

							//Trigger master event to select 1st item
							var oEventBus = sap.ui.getCore().getEventBus();
							oEventBus.publish("Detail", "selectFirstItemAfter");
						}
					}
				},
				function() {
					//Display error message (no response)
					jQuery.sap.require("sap.m.MessageBox");
					sap.m.MessageBox.show(
						"No response from gateway", {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Error",
							onClose: function(oAction) {

							}
						}
					);

				}

			);

		},

		/**
		 * Resets all value-states for the view table
		 */
		_clearErrorCells: function() {

			var row,
				oTable = this.byId("lineItemsList"),
				aItems = oTable.getItems();

			//Reset value-states
			for (row = 0; row < aItems.length; row++) {
				//Comment text area
				aItems[row].getCells()[0].getItems()[2].setValueState(sap.ui.core.ValueState.None);

			}

		},

		/**
		 * Sets amounts to emphasized
		 */
		_setAmountFormats: function() {

			var row,
				oTable = this.byId("lineItemsList"),
				oModelItems = oTable.getModel(),
				aItems = oTable.getItems();

			//Set emphasized property for amounts where the new value is different from the latest value
			for (row = 0; row < aItems.length; row++) {
				//Gross Cost/SRP in Inforecord
				aItems[row].getCells()[1].getItems()[1].setEmphasized(oModelItems.getProperty("Effpr", aItems[row].getBindingContext()) !== oModelItems.getProperty("NEffpr", aItems[row].getBindingContext()));

				//Latest CommRate%
				aItems[row].getCells()[2].getItems()[1].setEmphasized(oModelItems.getProperty("Kbetr", aItems[row].getBindingContext()) !== oModelItems.getProperty("NKbetr", aItems[row].getBindingContext()));

				//DC on Gross %
				aItems[row].getCells()[3].getItems()[1].setEmphasized(oModelItems.getProperty("Ra01", aItems[row].getBindingContext()) !== oModelItems.getProperty("NRa01", aItems[row].getBindingContext()));

				//DC Amount
				aItems[row].getCells()[4].getItems()[1].setEmphasized(oModelItems.getProperty("Rc00", aItems[row].getBindingContext()) !== oModelItems.getProperty("NRc00", aItems[row].getBindingContext()));

				//DC on Net %
				aItems[row].getCells()[5].getItems()[1].setEmphasized(oModelItems.getProperty("Ra00", aItems[row].getBindingContext()) !== oModelItems.getProperty("NRa00", aItems[row].getBindingContext()));

			}

		}

	});

});