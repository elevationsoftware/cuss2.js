"use strict";
exports.__esModule = true;
exports.State = void 0;
var rxjs_1 = require("rxjs");
var models_1 = require("./interfaces/models");
var State = /** @class */ (function () {
    function State() {
        this.baseURL = "";
        this.queryPending = [];
        this.requiredComponents = [];
        this.default_applicationBrand = "";
        this.default_executionMode = models_1.ApplicationActivation.ExecutionModeEnum.MAM;
        this.default_accessibleMode = false;
        this.default_executionOptions = "";
        this.default_languageID = "en-US";
        this.default_transferData = "";
        /**
         * Triggers when the application call the init function with the correct values
         */
        this.init_completed = new rxjs_1.BehaviorSubject(false);
        this.client_id = new rxjs_1.BehaviorSubject("");
        this.client_secret = new rxjs_1.BehaviorSubject("");
        /**
         * Help track the retriving of the authentication token
         */
        this.token_received = new rxjs_1.BehaviorSubject(false);
        this.token = new rxjs_1.BehaviorSubject("");
        /**
         * Event tracking when a listener is created
         */
        this.listener_created = new rxjs_1.BehaviorSubject(false);
        /**
         * Event tracking when a listener handlers are defined
         */
        this.listener_handler_created = new rxjs_1.BehaviorSubject(false);
        /**
         * Events subscriptions coming from CUSS Platform
         */
        this.cuss_events = new rxjs_1.BehaviorSubject({});
        /**
         * CUSS Websocket connection got disconnected
         */
        this.close_socket = new rxjs_1.BehaviorSubject(false);
        /**
         * Components Subscription triggers when components data is received from CUSS Platform
         */
        this.components$ = new rxjs_1.BehaviorSubject([]);
        this.components_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Environment Subscription triggers when the environment data is received from CUSS Platform
         */
        this.environment$ = new rxjs_1.BehaviorSubject({});
        this.environment_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Subcription tiggres when all compenet queries are received from CUSS Platform
         */
        this.query_completed = new rxjs_1.BehaviorSubject(false);
        /**
         * Subcription tiggres when all application required components are verified
         */
        this.component_validation_completed = new rxjs_1.BehaviorSubject({
            completed: false,
            requiredComponents: []
        });
        /**
         * Subject trigger when the available event gets returns from the cuss platform
         */
        this.available_event_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Subject trigger when the available event gets returns from the cuss platform
         */
        this.unavailable_event_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Subject trigger when the active event gets returns from the cuss platform
         */
        this.active_event_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Subject trigger when the stopped event gets returns from the cuss platform
         */
        this.stopped_event_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Subject trigger when the suspended event gets returns from the cuss platform
         */
        this.suspended_event_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Subject trigger when the wrong state event gets returns from the cuss platform
         */
        this.wrong_state_event_received = new rxjs_1.BehaviorSubject(false);
        /**
         * Application is ready to move to AVAILABLE
         */
        this.app_ready = new rxjs_1.BehaviorSubject(false);
        /**
         * Application was unable to find all required devices or required devices became unhealthy
         */
        this.app_failed = new rxjs_1.BehaviorSubject(false);
    }
    return State;
}());
exports.State = State;
