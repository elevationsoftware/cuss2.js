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
## Usage and Examples
### Usage
___
Import the related device service from the lib

Services available for use:

- BagTagPrinterService
- BoardingPassPrinterService
- CardReaderService
- DocumentReaderService
- BarcodeReaderService
- KeypadService
- AnnouncementService

Each device service provides an onReady behavior subject that emits the instance of the device object that has methods to interact with the device. Below are the required methods for basic device interactions.

| Method                                              | Description                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| announcement(componentID, rawData)         | <table>  <thead>  <tr><th> Method</th> <th> Description</th>  </tr>  </thead>  <tbody>  <tr>  <td>play(componentID, rawData)</td>  <td>Play the announcement</td>  </tr>  <tr>  <td>pause(componentID)</td>  <td>Pause the announcement</td>  </tr>  <tr>  <td>resume(componentID)</td>  <td>Resume the announcement</td>  </tr>  <tr>  <td>stop(componentID)</td>  <td>Stop the announcement</td>  </tr>  </tbody>  </table>          |                     
| cancel(componentID)                                 | Sends a cancel command to a given component (device).                                                               |                              
| checkRequiredComponentsAndSyncState()               | Check if all required components are available and move application to the appropriate state based on their status. |                        
| connect(url, client_id, client_secret, options opt) | Connect to the cuss platform.                                                                                       |               
| disable(componentID)                                | Sends disable command to a given component (device).                                                                |         
| enable(componentID)                                 | Sends enable command to a given component (device).                                                                 |         
| getComponents()                                     | Get a list of components.                                                                                           |         
| getEnvironment()                                    | Get the current environment level.                                                                                  |         
| getStatus(componentID)                              | Get the status of a given component (device).                                                                       |         
| queryComponents()                                   | Query each component for its current state.                                                                         |         
| requestActiveState()                                | Request the platform to change the application state to Active state.                                               |         
| requestReload()                                     | Request the platform to reload the application.                                                                     |         
| setup(componentID, dataExchange)                    | Send setup instructions to a given component (device).                                                              |
| staterequest(state, reasonCode, reason)             | Sends request to the platform for the application to change states.                                                 |
| authorize(url, client_id, client_secret, timeout)   | Retrieve a token from the CUSS Oauth Server using a client id and client secret.                                    |
| connect(baseURL, client_id, client_secret, tokenURL)| Connects to a CUSS Platform at the provided URL.                                                                    |


### Examples
___

