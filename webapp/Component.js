sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/nhpc/zhrsecaprf9s1/model/models",
    "com/nhpc/zhrsecaprf9s1/utils/messenger",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], (UIComponent, models, messenger, Filter, FilterOperator) => {
    "use strict";

    return UIComponent.extend("com.nhpc.zhrsecaprf9s1.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init: async function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createViewModel(), "viewModel");
            const oViewModel = this.getModel("viewModel");
            const oToday = new Date();
            const sToday = String(oToday.getDate()).padStart(2, "0") + "." +
                String(oToday.getMonth() + 1).padStart(2, "0") + "." +
                oToday.getFullYear();
            oViewModel.setProperty("/todayDate", sToday);
            const iYear = oToday.getFullYear();
            const iMonth = oToday.getMonth();
            let oFinancialYearStart;
            if (iMonth >= 3) {
                // April - December
                oFinancialYearStart = new Date(iYear, 3, 1);
            } else {
                // January - March
                oFinancialYearStart = new Date(iYear - 1, 3, 1);
            }
            oToday.setHours(0, 0, 0, 0);
            oViewModel.setProperty("/financialYearStart", oFinancialYearStart);
            oViewModel.setProperty("/financialYearEnd", oToday);
            // enable routing
            this.getRouter().initialize();
            await this._checkEligibility();
            messenger.init(this);
        },
        _checkEligibility: async function () {
            var oModel = this.getModel();
            var aFilters = [
                new Filter("ApprovalFlag", FilterOperator.EQ, "9")
            ];
            await oModel.read("/CheckAuthSet", {
                filters: aFilters,
                success: function (oResponse) {
                    if (oResponse.results && oResponse.results.length > 0 && oResponse.results[0].AuthResponse === "No") {
                        this.getRouter().navTo("RouteErrorPage", {}, true);
                    }
                }.bind(this),
                error: function () {
                }.bind(this)
            });

        }
    });
});