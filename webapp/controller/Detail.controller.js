sap.ui.define([
    "com/nhpc/zhrsecaprf9s1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "com/nhpc/zhrsecaprf9s1/utils/formatter",
    "com/nhpc/zhrsecaprf9s1/utils/messenger",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/format/NumberFormat",
], (BaseController, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger, BusyIndicator, NumberFormat) => {
    "use strict";

    return BaseController.extend("com.nhpc.zhrsecaprf9s1.controller.Detail", {
        formatter: formatter,
        onInit() {
            this.getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);
        },

        _onRoutePatternMatched: async function (oEvent) {
            let oArgs = oEvent.getParameter("arguments");
            let sPernr = oArgs.Pernr;
            let sNo = oArgs.Sno;
            let oViewModel = this.getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            if (sPernr === "New") {
                oViewModel.setProperty("/formDetails/Status", "New");
                oViewModel.setProperty("/TransactionHolding", []);
                oViewModel.setProperty("/TransactionRelatives", []);
                oViewModel.setProperty("/sNo", "");
                await this.setUndertakingText();
                this.byId("objPageHeader").setText(oResourceBundle.getText("createDialogTitle"));
                this.byId("objPageHeader1").setText(oResourceBundle.getText("createDialogTitle"));
            } else {
                oViewModel.setProperty("/sNo", sNo);
                await this.setFormDetails(sPernr, sNo);
                this.byId("objPageHeader").setText(oResourceBundle.getText("detailPageTitle", sNo));
                this.byId("objPageHeader1").setText(oResourceBundle.getText("detailPageTitle", sNo));
            }
            await this.getDefaultEmployeeDetails(sPernr);
        },

        setUndertakingText:async function(){
            let oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let oFilter = new Filter("Preview", FilterOperator.EQ, "X");
            await new Promise((resolve, reject) => {
                BusyIndicator.show(0);
                oModel.read("/Form9headSet", {
                    filters: [oFilter],
                    urlParameters: {
                        "$expand": "Form9HeadToSelf,Form9HeadToRelatives"
                    },
                    success: function (oData) {
                        BusyIndicator.hide();
                        if (oData.results.length === 0) {
                            messenger.error("No Data Found");
                            return;
                        }
                        oViewModel.setProperty("/formDetails/UndertakingText", oData.results[0].UndertakingText);
                        resolve();
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        reject(oError);
                    }
                });
            });
        },

        setFormDetails: async function (sPernr, sNo) {
            let oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let oFilter = new Filter({
                filters: [
                    new Filter(
                        "Pernr",
                        FilterOperator.EQ,
                        sPernr
                    ),
                    new Filter(
                        "Sno",
                        FilterOperator.EQ,
                        sNo
                    ),
                    new Filter(
                        "FormNo",
                        FilterOperator.EQ,
                        "FORM9"
                    ),
                    new Filter(
                        "ApproverFlag",
                        FilterOperator.EQ,
                        "9"
                    )
                ],
                and: true
            });
            await new Promise((resolve, reject) => {
                BusyIndicator.show(0);
                oModel.read("/Form9headSet", {
                    filters: [oFilter],
                    urlParameters: {
                        "$expand": "Form9HeadToSelf,Form9HeadToRelatives"
                    },
                    success: function (oData) {
                        BusyIndicator.hide();
                        if (oData.results.length === 0) {
                            messenger.error("No Data Found");
                            return;
                        }
                        oData.results[0].Form9HeadToSelf.results.map(i => {
                            i.Noofsecuritiesprev = Number(i.Noofsecuritiesprev)?.toString();
                            i.Noofsecuritiesheld = Number(i.Noofsecuritiesheld)?.toString();
                            i.Securitypurchased = Number(i.Securitypurchased)?.toString();
                            i.Securitysold = Number(i.Securitysold)?.toString();
                            i.Securitypurchasedconso = Number(i.Securitypurchasedconso)?.toString();
                            i.Securitysoldconso = Number(i.Securitysoldconso)?.toString();
                        });
                        oData.results[0].Form9HeadToRelatives.results.map(i => {
                            i.Noofsecuritiesprev = Number(i.Noofsecuritiesprev)?.toString();
                            i.Noofsecuritiesheld = Number(i.Noofsecuritiesheld)?.toString();
                            i.Securitypurchased = Number(i.Securitypurchased)?.toString();
                            i.Securitysold = Number(i.Securitysold)?.toString();
                            i.Securitypurchasedconso = Number(i.Securitypurchasedconso)?.toString();
                            i.Securitysoldconso = Number(i.Securitysoldconso)?.toString();
                        });
                        oViewModel.setProperty("/formDetails/Remarks","");
                        oViewModel.setProperty("/formDetails/Fromdate",oData.results[0].Fromdate);
                        oViewModel.setProperty("/formDetails/Todate",oData.results[0].Todate);
                        oViewModel.setProperty("/formDetails/DateOfJoining",oData.results[0].DateOfJoiningDP)
                        oViewModel.setProperty("/TransactionHolding", oData.results[0].Form9HeadToSelf.results);
                        oViewModel.setProperty("/TransactionRelatives", oData.results[0].Form9HeadToRelatives.results);
                        oViewModel.setProperty("/formDetails/Status", oData.results[0].Status);
                        oViewModel.setProperty("/formDetails/UndertakingText", oData.results[0].UndertakingText);
                        oViewModel.setProperty("/formDetails/Designation", oData.results[0].Designation);
                        resolve();
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        reject(oError);
                    }
                });
            });
        },
        getDefaultEmployeeDetails: function (sPernr) {
            return new Promise((resolve, reject) => {
                BusyIndicator.show(0);
                let oModel = this.getModel(),
                    oViewModel = this.getModel("viewModel");
                let aFilters = [
                    new Filter(
                        "DFLT",
                        FilterOperator.EQ,
                        "X"
                    )
                ];
                if (sPernr !== "New") {
                    aFilters = [
                        new Filter(
                            "PERNR",
                            FilterOperator.EQ,
                            sPernr
                        )
                    ];
                }
                oModel.read("/ZFI_GH_USER_F4", {
                    filters: aFilters,
                    success: async function (oResp) {
                        BusyIndicator.hide();
                        if (oResp.results && oResp.results.length > 0) {
                            oViewModel.setProperty("/formDetails/EmployeeId", oResp.results[0].PERNR);
                            oViewModel.setProperty("/formDetails/EmployeeName", oResp.results[0].ENAME);
                            oViewModel.setProperty("/formDetails/CompanyCode", oResp.results[0].BUKRS);
                            oViewModel.setProperty("/formDetails/EmployeeGrade", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrp", oResp.results[0].SUB_GROUP);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrpText", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/PersonnelSubArea", oResp.results[0].WERKS);
                            oViewModel.setProperty("/formDetails/PersonnelSubAreaText", oResp.results[0].PLANT);
                            oViewModel.setProperty("/formDetails/EmployeeDepartment", `${oResp.results[0].DEP_CODE} - ${oResp.results[0].DEP}`);
                            oViewModel.setProperty("/formDetails/PositionText", oResp.results[0].DESIG);
                            oViewModel.setProperty("/formDetails/USRID", oResp.results[0].USRID);
                            oViewModel.setProperty("/formDetails/MOBILE", oResp.results[0].MOBILE);
                            oViewModel.setProperty("/formDetails/EMAIL", oResp.results[0].EMAIL);
                            oViewModel.setProperty("/formDetails/DATE_JOIN", oResp.results[0].DATE_JOIN);
                        }
                        await this._getHistoryWithRemarksData(oResp.results[0].PERNR);
                        resolve();
                    }.bind(this),
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        }.bind(this));
                        reject(oError);
                    }.bind(this)
                });
            });
        },

        _getHistoryWithRemarksData: function (Pernr) {
            var oModel = this.getModel();
            var oVM = this.getModel("viewModel");
            var Sno = oVM.getProperty("/sNo");
            var aFilters = [
                new Filter("Pernr", FilterOperator.EQ, Pernr),
                new Filter("FormNo", FilterOperator.EQ, "FORM9"),
                new Filter("ApplicationNo", FilterOperator.EQ, Sno)
            ];

            oModel.read("/RemarkHistorySet", {
                filters: aFilters,
                success: function (oData) {
                    oVM.setProperty("/History", oData.results);
                    console.log("History Data", oData.results);
                }.bind(this),

                error: function () {
                    MessageBox.error("unableToFetchApplicationDetails");
                }
            });
        },

        resetValueStates: function () {
            let oViewModel = this.getModel("viewModel");

            oViewModel.setProperty("/valueState/Noofsecuritiesprev", "None");
            oViewModel.setProperty("/valueState/securityPurchased", "None");
            oViewModel.setProperty("/valueState/Noofsecuritiesheld", "None");
            oViewModel.setProperty("/valueState/Dpclientid", "None");
            oViewModel.setProperty("/valueState/Transactiondate", "None");
            oViewModel.setProperty("/valueState/Securitypurchased", "None");
            oViewModel.setProperty("/valueState/Securitysold", "None");
            oViewModel.setProperty("/valueState/Offmarket", "None");
            oViewModel.setProperty("/valueState/Relativename", "None");
            oViewModel.setProperty("/valueState/Relativetype", "None");

            oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", null);
            oViewModel.setProperty("/valueStateText/securityPurchased", null);
            oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", null);
            oViewModel.setProperty("/valueStateText/Dpclientid", null);
            oViewModel.setProperty("/valueStateText/Transactiondate", null);
            oViewModel.setProperty("/valueStateText/Securitypurchased", null);
            oViewModel.setProperty("/valueStateText/Securitysold", null);
            oViewModel.setProperty("/valueStateText/Offmarket", null);
            oViewModel.setProperty("/valueStateText/Relativename", null);
            oViewModel.setProperty("/valueStateText/Relativetype", null);
        },

        onAddTransactionHoldingDetails: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/selectedTransactionHolding", {});
            oViewModel.setProperty("/selectedTransactionHoldingIndex", null);
            let sTableData = oViewModel.getProperty("/TransactionHolding");
            if (sTableData.length > 0) {
                let sLastRow = sTableData[sTableData.length - 1];
                let sNoOfSecuritiesPrevHeld = sLastRow.Noofsecuritiesheld;
                oViewModel.setProperty("/selectedTransactionHolding/Noofsecuritiesprev", sNoOfSecuritiesPrevHeld);
                oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", false);
            } else {
                oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", true);
            }
            if (!this.oAddHoldingDialog) {
                this.oAddHoldingDialog = await Fragment.load({
                    name: "com.nhpc.zhrsecaprf9s1.fragment.TransactionHoldingsPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddHoldingDialog);
            }
            this.oAddHoldingDialog.open();
        },

        onEditTransactionHoldingDetails: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            let oTable = this.byId("idTransactionHoldingTable");
            let sSelectedItem = oTable.getSelectedItem();
            if (!sSelectedItem) {
                messenger.error(this.getResourceBundle().getText("selectRowToEdit"));
                return;
            }
            let sBindingContext = sSelectedItem.getBindingContext("viewModel");
            let sPath = sBindingContext.getPath();
            let iIndex = parseInt(sPath.split("/").pop(), 10);
            if (iIndex === 0) {
                oViewModel.setProperty("/editable/holdings/Noofsecuritiesprev", true);
            }
            let oResourceBundle = this.getResourceBundle();
            let sData = structuredClone(sBindingContext.getObject());
            oViewModel.setProperty("/selectedTransactionHolding", sData);
            if (!this.oAddHoldingDialog) {
                this.oAddHoldingDialog = await Fragment.load({
                    name: "com.nhpc.zhrsecaprf9s1.fragment.TransactionHoldingsPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddHoldingDialog);
            }
            this.oAddHoldingDialog.open();
        },

        onDeleteTransactionHoldingDetails: function () {
            let oTable = this.byId("idTransactionHoldingTable");
            let oViewModel = this.getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            let oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(oResourceBundle.getText("selectRowToDelete"));
                return;
            }
            let oContext = oSelectedItem.getBindingContext("viewModel");
            let sIndex = oContext.getPath().split("/").pop();
            let sTransactionHoldingTable = oViewModel.getProperty("/TransactionHolding");
            sTransactionHoldingTable.splice(sIndex, 1);
            oViewModel.setProperty("/TransactionHolding", sTransactionHoldingTable);
            messenger.success(oResourceBundle.getText("transactionHoldingDetailsDeleted"));
        },

        onSaveTransactionHoldingDetails: function () {
            let oViewModel = this.getModel("viewModel");
            let oSecurityDetails = oViewModel.getProperty("/selectedTransactionHolding");
            let oTableData = oViewModel.getProperty("/TransactionHolding") || [];
            let isEdit = oViewModel.getProperty("/selectedTransactionHoldingIndex") !== null;
            let isValid = this.checkTransactionHoldingsDetailsValidation(oSecurityDetails);
            if (!isValid) {
                messenger.error(this.getResourceBundle().getText("fillAllRequiredFields"));
                return;
            }
            if (isEdit) {
                let index = oViewModel.getProperty("/selectedTransactionHoldingIndex");
                oTableData[index] = oSecurityDetails;
            } else {
                oTableData.push(oSecurityDetails);
            }
            oViewModel.setProperty("/TransactionHolding", oTableData);
            oViewModel.setProperty("/selectedTransactionHoldingIndex", {});
            this.oAddHoldingDialog.close();
        },

        onCancelTransactionHoldingDetails: function () {
            this.oAddHoldingDialog.close();
        },

        checkTransactionHoldingsDetailsValidation: function (oSecurityDetails) {
            let oViewModel = this.getModel("viewModel");
            let errors = [];
            if (!oSecurityDetails.Noofsecuritiesprev) {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", null);
            }
            if (!oSecurityDetails.securityPurchased) {
                oViewModel.setProperty("/valueState/securityPurchased", ValueState.Error);
                oViewModel.setProperty("/valueStateText/securityPurchased", this.getResourceBundle().getText("SecurityPurchasedRequired"));
                errors.push(this.getResourceBundle().getText("securityPurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/securityPurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/securityPurchased", null);
            }
            if (!oSecurityDetails.Noofsecuritiesheld) {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", null);
            }
            if (!oSecurityDetails.Dpclientid) {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Dpclientid", this.getResourceBundle().getText("DpclientidRequired"));
                errors.push(this.getResourceBundle().getText("DpclientidRequired"));
            } else {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.None);
                oViewModel.setProperty("/valueStateText/Dpclientid", null);
            }
            if (!oSecurityDetails.Transactiondate) {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Transactiondate", this.getResourceBundle().getText("TransactiondateRequired"));
                errors.push(this.getResourceBundle().getText("TransactiondateRequired"));
            } else {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.None);
                oViewModel.setProperty("/valueStateText/Transactiondate", null);
            }
            if (!oSecurityDetails.Securitypurchased && oSecurityDetails.securityPurchased === "Bought") {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitypurchased", this.getResourceBundle().getText("SecurityPurchasedRequired"));
                errors.push(this.getResourceBundle().getText("SecuritypurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitypurchased", null);
            }
            if (!oSecurityDetails.Securitysold && oSecurityDetails.securityPurchased === "Sold") {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitysold", this.getResourceBundle().getText("SecuritysoldRequired"));
                errors.push(this.getResourceBundle().getText("SecuritysoldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitysold", null);
            }
            if (!oSecurityDetails.Offmarket) {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Offmarket", this.getResourceBundle().getText("OffmarketRequired"));
                errors.push(this.getResourceBundle().getText("OffmarketRequired"));
            } else {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.None);
                oViewModel.setProperty("/valueStateText/Offmarket", null);
            }
            return errors.length === 0;
        },

        onTransactionHoldingTableUpdateFinish: function () {
            let oViewModel = this.getModel("viewModel");
            let sTransactionHoldings = oViewModel.getProperty("/TransactionHolding") || [];
            let sTransactionHoldingsLength = sTransactionHoldings.length;
            oViewModel.setProperty("/TransactionHoldingLength", sTransactionHoldingsLength);
        },

        onAddSecurityDetailsRelatives: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/selectedTransactionRelatives", {});
            oViewModel.setProperty("/selectedTransactionRelativesIndex", null);
            oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", true);
            if (!this.oAddRelativeDialog) {
                this.oAddRelativeDialog = await Fragment.load({
                    name: "com.nhpc.zhrsecaprf9s1.fragment.TransactionRelativesPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddRelativeDialog);
            }
            this.oAddRelativeDialog.open();
        },

        onEditSecurityDetailsRelatives: async function () {
            this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            let oTable = this.byId("idTransactionRelativeTable");
            let oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(this.getResourceBundle().getText("selectRowToEdit"));
                return;
            }
            let oContext = oSelectedItem.getBindingContext("viewModel");
            let sPath = oContext.getPath();
            let iIndex = parseInt(sPath.split("/").pop(), 10);
            let oData = structuredClone(oContext.getObject());
            let aData = oViewModel.getProperty("/TransactionRelatives") || [];
            let bFirstOccurrence = true;
            for (let i = 0; i < iIndex; i++) {
                if (aData[i].Relativename === oData.Relativename) {
                    bFirstOccurrence = false;
                    break;
                }
            }
            oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", bFirstOccurrence);
            oViewModel.setProperty("/selectedTransactionRelatives", oData);
            if (!this.oAddRelativeDialog) {
                this.oAddRelativeDialog = await Fragment.load({
                    name: "com.nhpc.zhrsecaprf9s1.fragment.TransactionRelativesPopUp",
                    controller: this
                });
                oView.addDependent(this.oAddRelativeDialog);
            }
            this.oAddRelativeDialog.open();
        },

        onDeleteSecurityDetailsRelatives: function () {
            let oTable = this.byId("idTransactionRelativeTable");
            let oViewModel = this.getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            let oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(oResourceBundle.getText("selectRowToDelete"));
                return;
            }
            let oContext = oSelectedItem.getBindingContext("viewModel");
            let sIndex = oContext.getPath().split("/").pop();
            let sTransactionHoldingTable = oViewModel.getProperty("/TransactionRelatives");
            sTransactionHoldingTable.splice(sIndex, 1);
            oViewModel.setProperty("/TransactionRelatives", sTransactionHoldingTable);
            messenger.success(oResourceBundle.getText("transactionRelativeDetailsDeleted"));
        },

        onSaveTransactionRelativeDetails: function () {
            let oViewModel = this.getModel("viewModel");
            let oSecurityDetails = oViewModel.getProperty("/selectedTransactionRelatives");
            let oTableData = oViewModel.getProperty("/TransactionRelatives") || [];
            let isEdit = oViewModel.getProperty("/selectedTransactionRelativesIndex") !== null;
            let isValid = this.checkTransactionRelativesDetailsValidation(oSecurityDetails);
            if (!isValid) {
                messenger.error(this.getResourceBundle().getText("fillAllRequiredFields"));
                return;
            }
            if (isEdit) {
                let index = oViewModel.getProperty("/selectedTransactionRelativesIndex");
                oTableData[index] = oSecurityDetails;
            } else {
                oTableData.push(oSecurityDetails);
            }
            oViewModel.setProperty("/TransactionRelatives", oTableData);
            oViewModel.setProperty("/selectedTransactionRelativesIndex", {});
            this.updateDate();
            this.oAddRelativeDialog.close();
        },

        onCancelTransactionRelativeDetails: function () {
            this.oAddRelativeDialog.close();
        },

        checkTransactionRelativesDetailsValidation: function (oSecurityDetails) {
            let oViewModel = this.getModel("viewModel");
            let errors = [];
            if (!oSecurityDetails.Relativename) {
                oViewModel.setProperty("/valueState/Relativename", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Relativename", this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
                errors.push(this.getResourceBundle().getText("RelativenameRequired"));
            } else {
                oViewModel.setProperty("/valueState/Relativename", ValueState.None);
                oViewModel.setProperty("/valueStateText/Relativename", null);
            }
            if (!oSecurityDetails.Noofsecuritiesprev) {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesprevRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesprev", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesprev", null);
            }
            if (!oSecurityDetails.securityPurchased) {
                oViewModel.setProperty("/valueState/securityPurchased", ValueState.Error);
                oViewModel.setProperty("/valueStateText/securityPurchased", this.getResourceBundle().getText("SecurityPurchasedRequired"));
                errors.push(this.getResourceBundle().getText("securityPurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/securityPurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/securityPurchased", null);
            }
            if (!oSecurityDetails.Noofsecuritiesheld) {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
                errors.push(this.getResourceBundle().getText("NoofsecuritiesheldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Noofsecuritiesheld", ValueState.None);
                oViewModel.setProperty("/valueStateText/Noofsecuritiesheld", null);
            }
            if (!oSecurityDetails.Dpclientid) {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Dpclientid", this.getResourceBundle().getText("DpclientidRequired"));
                errors.push(this.getResourceBundle().getText("DpclientidRequired"));
            } else {
                oViewModel.setProperty("/valueState/Dpclientid", ValueState.None);
                oViewModel.setProperty("/valueStateText/Dpclientid", null);
            }
            if (!oSecurityDetails.Relativetype) {
                oViewModel.setProperty("/valueState/Relativetype", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Relativetype", this.getResourceBundle().getText("TransactiondateRequired"));
                errors.push(this.getResourceBundle().getText("RelativetypeRequired"));
            } else {
                oViewModel.setProperty("/valueState/Relativetype", ValueState.None);
                oViewModel.setProperty("/valueStateText/Relativetype", null);
            }
            if (!oSecurityDetails.Transactiondate) {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Transactiondate", this.getResourceBundle().getText("TransactiondateRequired"));
                errors.push(this.getResourceBundle().getText("TransactiondateRequired"));
            } else {
                oViewModel.setProperty("/valueState/Transactiondate", ValueState.None);
                oViewModel.setProperty("/valueStateText/Transactiondate", null);
            }
            if (!oSecurityDetails.Securitypurchased && oSecurityDetails.securityPurchased === "Bought") {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitypurchased", this.getResourceBundle().getText("SecurityPurchasedRequired"));
                errors.push(this.getResourceBundle().getText("SecuritypurchasedRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitypurchased", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitypurchased", null);
            }
            if (!oSecurityDetails.Securitysold && oSecurityDetails.securityPurchased === "Sold") {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Securitysold", this.getResourceBundle().getText("SecuritysoldRequired"));
                errors.push(this.getResourceBundle().getText("SecuritysoldRequired"));
            } else {
                oViewModel.setProperty("/valueState/Securitysold", ValueState.None);
                oViewModel.setProperty("/valueStateText/Securitysold", null);
            }
            if (!oSecurityDetails.Offmarket) {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Offmarket", this.getResourceBundle().getText("OffmarketRequired"));
                errors.push(this.getResourceBundle().getText("OffmarketRequired"));
            } else {
                oViewModel.setProperty("/valueState/Offmarket", ValueState.None);
                oViewModel.setProperty("/valueStateText/Offmarket", null);
            }
            return errors.length === 0;
        },
        onTransactionRelativeTableUpdateFinish: function () {
            let oViewModel = this.getModel("viewModel");
            let sTransactionHoldings = oViewModel.getProperty("/TransactionRelatives") || [];
            let sTransactionHoldingsLength = sTransactionHoldings.length;
            oViewModel.setProperty("/TransactionRelativesLength", sTransactionHoldingsLength);
        },
        onRelativeChange: async function (oEvent) {
            await this.onComboboxChange(oEvent);
            let oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let sRelative = oEvent.getSource().getSelectedKey().trim();
            let aData = oViewModel.getProperty("/TransactionRelatives") || [];
            let oLatestRecord = null;
            for (let i = aData.length - 1; i >= 0; i--) {
                if (aData[i].Relativename === sRelative) {
                    oLatestRecord = aData[i];
                    break;
                }
            }
            var oData = oEvent.getSource().getSelectedItem()?.getBindingContext().getObject();
            oViewModel.setProperty("/selectedTransactionRelatives/Relativetype", oData.RelativeType + " - " + oData.RelativeText);
            if (oLatestRecord) {
                oViewModel.setProperty("/selectedTransactionRelatives/Noofsecuritiesprev", oLatestRecord.Noofsecuritiesheld);
                oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", false);
            } else {
                oViewModel.setProperty("/selectedTransactionRelatives/Noofsecuritiesprev", null);
                oViewModel.setProperty("/editable/relatives/Noofsecuritiesprev", true);
            }
        },

        updateDate: function () {
            let oViewModel = this.getModel("viewModel");

            let aHoldingsData = oViewModel.getProperty("/TransactionHolding") || [];
            let aRelativesData = oViewModel.getProperty("/TransactionRelatives") || [];

            let aAllData = [...aHoldingsData, ...aRelativesData];
            let aDates = aAllData
                .map(function (oItem) {
                    return oItem.Transactiondate;
                })
                .filter(function (sDate) {
                    return !!sDate;
                });

            if (aDates.length === 0) {
                oViewModel.setProperty("/formDetails/Fromdate", "");
                oViewModel.setProperty("/formDetails/Todate", "");
                return;
            }

            let sFromDate = aDates.reduce(function (min, date) {
                return date < min ? date : min;
            });

            let sToDate = aDates.reduce(function (max, date) {
                return date > max ? date : max;
            });

            oViewModel.setProperty("/formDetails/Fromdate", sFromDate);
            oViewModel.setProperty("/formDetails/Todate", sToDate);
        },

        handleSaveBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_SAVE_REQUEST"),
                aErrors = [],
                oViewModel = this.getModel("viewModel"),
                oFormDetails = oViewModel.getProperty("/formDetails");
            var oModel = this.getModel();
            messenger.confirm(sTitle, sText, "Confirm", null, function () {
                BusyIndicator.show(0);
                this.sActionFlag = "Draft";
                let oPayload = this.createRequestPayload();
                oModel.create("/Form9headSet", oPayload, {
                    success: function (oResp) {
                        BusyIndicator.hide();
                        messenger.success(oResourceBundle.getText("FinalSaveMsg", oResp.Sno), () => {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        });
                    }.bind(this),
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }.bind(this)
                });
            }.bind(this));
        },
        handleSubmitBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST"),
                bProceed = this.validateSubmitRequestDetails();
            var oModel = this.getModel();
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    this.sActionFlag = "CONFIRM";
                    let oPayload = this.createRequestPayload();
                    oModel.create("/Form9headSet", oPayload, {
                        success: function (oResp) {
                            BusyIndicator.hide();
                            messenger.success(oResourceBundle.getText("FinalSuccessMsg", [oResp.Sno]), () => {
                                this.getRouter().navTo("RouteDashboard", {}, {}, true);
                            });
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },
        validateSubmitRequestDetails: function () {
            let oResourceBundle = this.getResourceBundle();
            let bProceed = true;
            let oViewModel = this.getModel("viewModel");
            let aHoldingsData = oViewModel.getProperty("/TransactionHolding") || [];
            let aRelativesData = oViewModel.getProperty("/TransactionRelatives") || [];
            if (aHoldingsData.length === 0 && aRelativesData.length === 0) {
                bProceed = false;
                messenger.error(oResourceBundle.getText("atLeastOneLineItemErrorMsg"));
            }
            return bProceed;
        },
        createRequestPayload: function () {
            var oViewModel = this.getModel("viewModel"),
                oFormDetails = oViewModel.getProperty("/formDetails"),
                oHoldingsData = oViewModel.getProperty("/TransactionHolding"),
                oRelativesData = oViewModel.getProperty("/TransactionRelatives");
            var oPayload = {
                "Pernr": oFormDetails.EmployeeId,
                "EmployeeName": oFormDetails.EmployeeName,
                "Department": oFormDetails.EmployeeDepartment,
                "DateOfJoiningDP": oFormDetails.DateOfJoining,
                Status: this.sActionFlag,
                Form9HeadToSelf: oHoldingsData,
                Form9HeadToRelatives: oRelativesData,
                Fromdate : oFormDetails.Fromdate,
                Todate: oFormDetails.Todate,
                Delayed: oFormDetails.Delayed,
                Contra: oFormDetails.Contra,
                FormNo: "FORM9"
            };
            let sNo = oViewModel.getProperty("/sNo");
            if (sNo) {
                oPayload.Sno = sNo
            }
            oPayload.Rejectionremarks = oFormDetails.Remarks;
            return oPayload;
        },

        onDecisionSubmitApprove: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_APPROVE_REQUEST"),
                bProceed = true;
            var oModel = this.getModel();
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    this.sActionFlag = "Approved";
                    let oPayload = this.createRequestPayload();
                    oModel.create("/Form9headSet", oPayload, {
                        success: function (oResp) {
                            BusyIndicator.hide();
                            messenger.success(oResourceBundle.getText("FinalApproveMsg", oResp.Sno), () => {
                                this.getRouter().navTo("RouteDashboard", {}, {}, true);
                            });
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },
        onDecisionSubmitReturn: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_RETURN_REQUEST");
            var oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let isMandatoryFilled = oViewModel.getProperty("/formDetails/Remarks");
            if (!isMandatoryFilled || isMandatoryFilled?.trim() === "") {
                oViewModel.setProperty("/valueState/Remarks", "Error");
                oViewModel.setProperty("/valueStateText/Remarks", oResourceBundle.getText("remarkErrorMsg"));
                return;
            } else {
                oViewModel.setProperty("/valueState/Remarks", "None");
                oViewModel.setProperty("/valueStateText/Remarks", oResourceBundle.getText("remarkErrorMsg"));
            }
            messenger.confirm(sTitle, sText, "Confirm", null, function () {
                BusyIndicator.show(0);
                this.sActionFlag = "Returned";
                let oPayload = this.createRequestPayload();
                oModel.create("/Form9headSet", oPayload, {
                    success: function (oResp) {
                        BusyIndicator.hide();
                        messenger.success(oResourceBundle.getText("FinalReturnMsg", oResp.Sno), () => {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        });
                    }.bind(this),
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }.bind(this)
                });
            }.bind(this));

        },
        onDecisionSubmit: function (oEvent) {
            const sDecision = this.getModel("viewModel").getProperty("/decision");
            const fnHandler = sDecision === "Approve"
                ? this.onDecisionSubmitApprove
                : this.onDecisionSubmitReturn;

            fnHandler.call(this, oEvent);
        },
        handleReturnBtnPress: async function () {
            this.getModel("viewModel").setProperty("/decision","Return");
            if (!this._oRemarksDialog) {
                this._oRemarksDialog = await sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrsecaprf9s1.fragment.Remarks",
                    controller: this
                });

                this.getView().addDependent(this._oRemarksDialog);
            }

            this._oRemarksDialog.open();
        },
        handleApproveBtnPress: async function () {
            this.getModel("viewModel").setProperty("/decision","Approve");
            if (!this._oRemarksDialog) {
                this._oRemarksDialog = await sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrsecaprf9s1.fragment.Remarks",
                    controller: this
                });

                this.getView().addDependent(this._oRemarksDialog);
            }

            this._oRemarksDialog.open();
        },
        onDecisionCancel: function(){
            this._oRemarksDialog.close();
        },
        handlePreviewBtnPress: async function () {
            let oView = this.getView();
            if (!this.oPreviewDialog) {
                this.oPreviewDialog = await Fragment.load({
                    name: "com.nhpc.zhrsecaprf9s1.fragment.Form9Preview",
                    controller: this
                });
                oView.addDependent(this.oPreviewDialog);
            }
            this.oPreviewDialog.open();
        },
        onForm9PreviewCancel: function(){
            this.oPreviewDialog.close();
        }
    });
});