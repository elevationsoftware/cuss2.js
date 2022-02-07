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


## The Sandbox

While you are developing your application, you can use the Elevated CUSS Sandbox against real platform responses. Watch your application respond correctly to CUSS Events like a paper jam or a required device unavailable.
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

| Method                       | Description                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| deviceName.| |                     
| deviceName.| |                     
| deviceName.| |               
| deviceName.| |      
| deviceName.| |


### Examples
___

