# @elevated-libs/cuss2

## Publishing changes
- Clone repo
- Install dependecies
- run `npm publish`

# Elevated CUSS Library

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

Interact with a CUSS 2.0 RestFul API using a simple interface that simplify the asyncronisity nature of event driven acquitectures. By using the Elevated CUSS library you will get:

  - Simple device interfaces
  - Subscribable events for all CUSS states and device status
  - Typescript libs for Angular and React

# Event Life Cycle

 - initCompleted 
    - The application just called the init function with the appropiate parameters

 - token
    - The OAuth Server just returned a token to the applicaiton, this events contains the actual token values
    ```js
    cuss.token.subscribe(({access_token}) => console.log(`${access_token}`));

  - tokenReceived
    - The application succefully acquired a token and it is ready to create a listener on the cuss platform

  - listenerCreated
    - A websocket connection was succesfully created and now the application is allow to interact with the CUSS api
  
  - environmentReceived
    - The application just recceived the environment response from the platform and now it is allow to make a request for components availability
  
  - componentsReceived
    - The application just receieved all the components available with their characteristics from theplatform.

  - queryCompleted
    - The application succefully query all the devices in the platform
  
  - requiredComponentsFound
    - The applicaton was able to identify and validate the state of all required components; at this point it could request an state change to become AVAILABLE

  - requiredComponentsMissing
    - The application was unable to identify or validate the sate of all required components within the platform; at this point it could request an state change to become UNAVAILABLE


# Basic Initialization flow

## importing the elevated cuss 2 lib

```js
import { cuss, ComponentName, ApplicationStates } from '@elevated-libs/cuss2';
```

## specify required components

```js
requiredComponets: ComponentName[] = [ComponentName.BARCODE_READER, ComponentName.BAGTAG_PRINTER, ComponentName.BOARDINGPASS_PRINTER]
```

## call the init method

```js
cuss.init({
      clientId: 'APPLICATION- CLIENT-ID',
      clientSecret: 'APPLICATION-CLIENT-SECRET',
      baseURL: 'VENDOR-CUSS-URL',
      oauthURL: 'VENDOR-OAUTH-SERVER-URL',
      requiredComponents: requiredComponets
    })
 ```

 ## subscribe to main events

 ```js
  // handle when all required components are present
    cuss.requiredComponentsFound
    .subscribe((found) => {
        if (found) {
          console.log("Validation completed");
          this.title = "Moving to Available";
          cuss.moveToState(ApplicationStates.AVAILABLE);
        }
    });

    // handle when missing required components
    cuss.requiredComponentsMissing
    .subscribe(({missing, components}) => {
      if (missing) {
        this.title = "Missing Components";
        console.log("Missing required components", components);
        cuss.moveToState(ApplicationStates.UNAVAILABLE);
      }
    });
 ```