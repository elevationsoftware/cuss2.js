"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.HttpRequests = void 0;
var state_1 = require("./state");
var axios_1 = require("axios");
console.log(axios_1["default"]);
var HttpRequests = /** @class */ (function (_super) {
    __extends(HttpRequests, _super);
    function HttpRequests() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.headers = function () {
            return {
                Authorization: "Bearer " + _this.token.getValue(),
                "Content-Type": "application/json"
            };
        };
        _this.INIT_ERROR = "Needs to call init methods first";
        return _this;
    }
    HttpRequests.prototype.GlobalCall = function (fn) {
        var _this = this;
        return new Promise(function (rs, rj) {
            if (!_this.init_completed.getValue()) {
                return rj(_this.INIT_ERROR);
            }
            return fn(rs, rj);
        });
    };
    HttpRequests.prototype.post = function (url, data) {
        return axios_1["default"]({
            method: "POST",
            data: data,
            headers: this.headers(),
            url: url
        });
    };
    HttpRequests.prototype.get = function (url) {
        return axios_1["default"]({
            method: "GET",
            headers: this.headers(),
            url: url
        });
    };
    /**
     * Retrieve a token from the CUSS Oauth Server using a client
     * id and client secret
     */
    HttpRequests.prototype.getToken = function () {
        var _this = this;
        return this.GlobalCall(function (rs, rj) {
            _this.post(_this.baseURL + "/oauth/token", {
                client_id: _this.client_id.getValue(),
                client_secret: _this.client_secret.getValue()
            })
                .then(function (_a) {
                var access_token = _a.data.access_token;
                _this.token.next(access_token);
                console.log("Token acquired", access_token);
                rs(access_token);
            })["catch"](function (err) { return rj(err); });
        });
    };
    /**
     * Connects the application to the CUSS Webocket server and generate listeners
     * for: Errors, Open, Message, Close
     */
    HttpRequests.prototype.getListener = function (access_token) {
        var _this = this;
        return new Promise(function (rs, rj) {
            var wsURL = "ws";
            if (/https/.test(_this.baseURL)) {
                wsURL += "s";
            }
            var socketURL = _this.baseURL
                .replace("https", "")
                .replace("http", "")
                .replace("://", "");
            _this.socket = new WebSocket(wsURL + "://" + socketURL + "/subscribe?access_token=" + _this.token.getValue());
            _this.socket.addEventListener("open", function () {
                console.log("Socket open");
                _this.socket.send(JSON.stringify({ access_token: access_token }));
                rs("");
            });
            _this.socket.addEventListener("error", function (err) {
                console.log("Socket error", err);
                _this.close_socket.next(true);
                rs("");
            });
            _this.socket.addEventListener("close", function (evnt) {
                console.log("Socket closed", evnt.reason);
                _this.close_socket.next(true);
                rs("");
            });
            _this.socket.addEventListener("message", function (evnt) {
                //console.log("Socket data", evnt);
                var data = JSON.parse(evnt.data);
                if (data.returnCode) {
                    console.log("Token Received");
                    _this.listener_created.next(true);
                }
                else {
                    _this.cuss_events.next(data);
                }
                rs("");
            });
        });
    };
    /**
     * Request the cuss environment after stablishing the appropiate listener
     */
    HttpRequests.prototype.getEnvironment = function () {
        return this.get(this.baseURL + "/platform/environment");
    };
    /**
     * Retrieve the cuss component list
     */
    HttpRequests.prototype.getComponents = function () {
        return this.get(this.baseURL + "/platform/components");
    };
    /**
     * Query all the components returned from the get component call
     */
    HttpRequests.prototype.queryComponents = function () {
        var _this = this;
        var calls = [];
        this.components$.getValue().forEach(function (c) {
            var url = _this.baseURL + "/peripherals/query/" + c.componentID;
            console.log("URL", url);
            calls.push(_this.get(url));
        });
    };
    /**
     * Request an application state transfer to the cuss platform
     * @param state desire state from the application to the platform
     * @param activation Application required state
     */
    HttpRequests.prototype.stateRequest = function (state, activation) {
        return this.post(this.baseURL + "/platform/applications/staterequest/" + state, activation);
    };
    HttpRequests.prototype.moveToState = function (state, activation) {
        if (activation === void 0) { activation = {
            applicationBrand: this.default_applicationBrand,
            executionMode: this.default_executionMode,
            accessibleMode: this.default_accessibleMode,
            executionOptions: this.default_executionOptions,
            languageID: this.default_languageID,
            transferData: this.default_transferData
        }; }
        return this.post(this.baseURL + "/platform/applications/staterequest/" + state, activation);
    };
    return HttpRequests;
}(state_1.State));
exports.HttpRequests = HttpRequests;
