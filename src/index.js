"use strict";
// import { ComponentName } from "./lib/interfaces/componentNames";
// import { ApplicationStates } from "./lib/interfaces/models";
// import { RequiredDevices } from "./lib/interfaces/requiredDevices";
// import { cuss } from "./lib/main";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
// const requiredDevices: RequiredDevices[] = [
//   { name: ComponentName.BARCODE_READER, found: false, status: false },
//   { name: ComponentName.BAGTAG_PRINTER, found: false, status: false },
//   { name: ComponentName.BOARDINGPASS_PRINTER, found: false, status: false }
// ];
// cuss.init(
//   "BLD",
//   "a149a9b4-aa57-43fb-82d0-9ec74bfb1705",
//   "https://cuss2.herokuapp.com",
//   requiredDevices
// );
// cuss.component_validation_completed.subscribe(
//   ({ completed, requiredComponents }) => {
//     // Wait until validation is completed
//     if (completed) {
//       //check if all required components are present
//       if (requiredComponents && requiredComponents.every((c) => c.found)) {
//         console.log("Validation completed", requiredComponents);
//         cuss.moveToState(ApplicationStates.AVAILABLE);
//       } else {
//         console.log("Missing required components", requiredComponents);
//         cuss.moveToState(ApplicationStates.UNAVAILABLE);
//       }
//     }
//   }
// );
__exportStar(require("./lib/http_requests"), exports);
__exportStar(require("./lib/main"), exports);
__exportStar(require("./lib/interfaces/models"), exports);
