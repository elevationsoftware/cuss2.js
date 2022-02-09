# @elevated-libs/cuss2

## About Elevated CUSS Library

Interact with a CUSS 2.0 Restful API using a simple interface leveraging the asyncronicity of event driven architectures. By using the Elevated CUSS library you will get:

  - Simple device interfaces
  - Subscribable events for all CUSS states and device status
  

CUSS [(Common Use Self-Service)](https://en.wikipedia.org/wiki/Common-use_self-service) is a modern Typescript library facilitating application development of Self-Service check-in apps, self-tagging apps and self bag-drop apps.

You can have CUSS 2.0 NOW and run a modern browser entirely without plugins or Java. Finally, your Information Security department will be able to sign off on your CUSS applications.  

We have also created typescript angular and react libs facilitating rapid development of CUSS applications.  

The library and corresponding app platform also ensure backwards compatibility to legacy 1.X versions of CUSS.

- Typescript libs for [Angular](https://github.com/elevationsoftware/cuss2-angular) and [React](https://github.com/elevationsoftware/cuss2-react)


## The Sandbox - Coming Soon

While you are developing your application, you can use the Elevated CUSS Sandbox against real platform responses. Watch your application respond correctly to CUSS Events like a paper jam or a required device unavailable.
- [CUSS Sandbox]() - Coming Soon

## Getting Started

1. Request an access token from the Elevation Software Team.  
  
2. Generate an `.npmrc` file and add the token to this file.

To install the lib run:

```sh
npm install @elevated-libs/cuss2
```

To begin using the library, you will need to import the library into your project and set up a connection.

```ts
import { Cuss2 } from "@elevated-libs/cuss2";

const serviceState: { ref: Cuss2 | any} = { ref: null };
const connect = async (cuss2URL: string, clientId: string, clientSecret: string): Promise<Cuss2 | null> => {
    // Avoid multiple subscriptions
    if (serviceState.ref) {
        return serviceState.ref;
    }
    const ref = await Cuss2.connect(cuss2URL, clientId, clientSecret);
    serviceState.ref = ref;
    return ref;
};

// Connect to cuss2 Platform
const { clientId, clientSecret, platformURL } = platformConfig;
connect(platformURL, clientId, clientSecret)
  .then(checkDevices)
  .catch(connectionFailure);
```
### Methods and Components
Below are the methods you can use to interact with the CUSS 2.0 API and a list of components. 
___

| Method                                              | Description                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| announcement(componentID, rawData)                  |<table><thead><tr><th>Method</th><th>Description</th></tr></thead><tbody><tr><td>play(componentID, rawData)</td><td>Play the announcement</td></tr><tr><td>pause(componentID)</td><td>Pause the announcement</td></tr><tr><td>resume(componentID)</td><td>Resume the announcement</td></tr><tr><td>stop(componentID)</td><td>Stop the announcement</td></tr></tbody></table>|                     
| cancel(componentID)                                 | Sends a cancel command to a given component (device).                                                         |                              
| checkRequiredComponentsAndSyncState()               | Check if all required components are available and move application to the appropriate state based on status. |                        
| connect(url, client_id, client_secret, options opt) | Connect to the cuss platform.                                                                                 |               
| disable(componentID)                                | Sends disable command to a given component (device).                                                          |         
| enable(componentID)                                 | Sends enable command to a given component (device).                                                           |         
| getComponents()                                     | Get a list of components.                                                                                     |         
| getEnvironment()                                    | Get the current environment level.                                                                            |         
| getStatus(componentID)                              | Get the status of a given component (device).                                                                 |         
| queryComponents()                                   | Query each component for its current state.                                                                   |         
| requestActiveState()                                | Request the platform to change the application state to Active state.                                         |         
| requestReload()                                     | Request the platform to reload the application.                                                               |         
| setup(componentID, dataExchange)                    | Send setup instructions to a given component (device).                                                        |
| staterequest(state, reasonCode, reason)             | Sends request to the platform for the application to change states.                                           |
| authorize(url, client_id, client_secret, timeout)   | Retrieve a token from the CUSS Oauth Server using a client id and client secret.                              |
| connect(baseURL, client_id, client_secret, tokenURL)| Connects to a CUSS Platform at the provided URL.                                                              |
___

| Components          | Description                                       |
| ------------------- | ------------------------------------------------- |
| Announcement        | A component that announces messages.              |
| BagTagPrinter       | A component that prints bag tags.                 |
| BarcodeReader       | A component that reads barcodes.                  |
| BoardingPassPrinter | A component that prints boarding passes.          |
| CardReader          | A component that reads cards.                     |
| Dispenser           | A part of a printer that dispenses printed media. |
| DocumentReader      | A component that reads documents.                 |
| Feeder              | A part of a printer that feeds paper.             |
| Headset             | A component that provides audio feedback.         |
| Illumination        | A component that controls illumination.           |
| Keypad              | A component that provides keypad input.           |
