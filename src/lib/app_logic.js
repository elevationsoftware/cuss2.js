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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.CussLogic = void 0;
var component_finder_1 = require("./component-finder");
var http_requests_1 = require("./http_requests");
var models_1 = require("./interfaces/models");
var CussLogic = /** @class */ (function (_super) {
    __extends(CussLogic, _super);
    function CussLogic() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     *  Set the required values to interact with a cuss platform
     * @param clientId client id
     * @param clientSecret secret provided by cuss platform
     * @param baseURL cuss platform url
     * @param requiredComponents required components by the cuss application
     */
    CussLogic.prototype.init = function (clientId, clientSecret, baseURL, requiredComponents, autoStart) {
        if (requiredComponents === void 0) { requiredComponents = []; }
        if (autoStart === void 0) { autoStart = true; }
        if (this.init_completed.getValue()) {
            console.log("Init method was already called");
            return this;
        }
        this.client_id.next(clientId);
        this.client_secret.next(clientSecret);
        this.baseURL = baseURL;
        this.requiredComponents = requiredComponents;
        this.init_completed.next(true);
        if (autoStart) {
            this.cussAutoStart();
        }
        return this;
    };
    CussLogic.prototype.cussAutoStart = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getToken()];
                    case 1:
                        token = _a.sent();
                        return [4 /*yield*/, this.getListener(token)];
                    case 2:
                        _a.sent();
                        this.setMessageHandler();
                        this.components$.subscribe(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.queryComponents()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        this.query_completed.subscribe(function (completed) {
                            if (completed && _this.requiredComponents.length) {
                                _this.findRequiredComponents(_this.requiredComponents);
                            }
                        });
                        this.listener_created.subscribe(function (created) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!created) return [3 /*break*/, 2];
                                        console.log("Listener created");
                                        return [4 /*yield*/, this.getEnvironment()];
                                    case 1:
                                        _a.sent();
                                        this.getComponents();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creating a handler for the events coming from the cuss platform
     */
    CussLogic.prototype.setMessageHandler = function () {
        var _this = this;
        this.cuss_events.subscribe(function (ev) {
            console.log("CUSS", ev);
            if (ev.functionName === "environment" && ev.environmentLevel) {
                _this.environment$.next(ev.environmentLevel);
                console.log("Environment", ev.environmentLevel);
                _this.environment_received.next(true);
            }
            if (ev.functionName === "components" && ev.componentList) {
                // keep a list of all available components ids
                _this.queryPending = ev.componentList.map(function (d) { return d.id; });
                _this.components$.next(ev.componentList);
                _this.components_received.next(true);
            }
            if (ev.functionName === "query") {
                _this.updateDeviceState(ev);
            }
            if (ev.currentApplicationState === models_1.ApplicationStates.AVAILABLE) {
                _this.available_event_received.next(true);
            }
            if (ev.currentApplicationState === models_1.ApplicationStates.UNAVAILABLE) {
                _this.unavailable_event_received.next(true);
            }
            _this.listener_handler_created.next(true);
        });
    };
    /**
     * Update device status after queries or device changes and triggers the query_completed event when is done
     * @param ev CUSSEvent events coming from cuss platform
     */
    CussLogic.prototype.updateDeviceState = function (ev) {
        var found = this.components$
            .getValue()
            .find(function (c) { return c.componentID === ev.componentID; });
        if (found) {
            found["statusCode"] = ev.statusCode;
            found["eventCode"] = ev.eventCode;
            console.log("new Device", found);
            this.queryPending.splice(this.queryPending.indexOf(found.id), 1);
        }
        if (this.queryPending.length === 0) {
            this.query_completed.next(true);
        }
    };
    /**
     * Check the availability of the required components and triggers the component_validation_completed when is done
     * @param requiredComponents required components for the application
     */
    CussLogic.prototype.findRequiredComponents = function (requiredComponents) {
        var _this = this;
        console.log(requiredComponents);
        component_finder_1.componentFinder(requiredComponents, this.components$.getValue())["finally"](function () {
            return _this.component_validation_completed.next({
                completed: true,
                requiredComponents: requiredComponents
            });
        });
    };
    return CussLogic;
}(http_requests_1.HttpRequests));
exports.CussLogic = CussLogic;
