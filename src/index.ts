// import { ComponentName } from "./lib/interfaces/componentNames";
// import { ApplicationStates } from "./lib/interfaces/models";
// import { RequiredDevices } from "./lib/interfaces/requiredDevices";
// import { cuss } from "./lib/main";

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

export * from "./lib/http_requests";
export * from "./lib/main";
export * from "./lib/interfaces/models";
