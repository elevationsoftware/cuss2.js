# @elevated-libs/cuss2

## Publishing changes
- Clone repo
- Install dependecies
- run `npm publish`

# Elevated CUSS Library

Interact with a CUSS 2.0 Restful API using a simple interface leveraging the asyncronicity of event driven architectures. By using the Elevated CUSS library you will get:

  - Simple device interfaces
  - Subscribable events for all CUSS states and device status
  - Typescript libs for Angular and React


```js
// ** if running with Node.js, we need WebSocket **
// global.WebSocket = (await import('ws')).default;


import { Cuss2, ApplicationStates } from "@elevated-libs/cuss2";

const kiosk = await Cuss2.connect('https://<cuss2_server>', '<client_id>', '<client_secret>');

console.log(kiosk.environment)
```

# State Management

```js
kiosk.stateChange.subscribe(async (state) => {
  try {
    switch (state) {
      case ApplicationStates.INITIALIZE:
        // await kiosk.setup('HDCTL000#1234567890', 4)
        await kiosk.requestUnavailableState();
        break;
      case ApplicationStates.UNAVAILABLE:
        await kiosk.requestAvailableState();
        break;
      case ApplicationStates.AVAILABLE:
        await kiosk.requestActiveState();
        break;
      case ApplicationStates.ACTIVE:
        kiosk.print('HDCPECTAB#00000000');
        break;
    }
  }
  catch (e) {
    console.error(e);
  }
});
```
