import { getCompomentName } from './component-finder';
import { HttpRequests } from "./http_requests";
import { logger, logConfig } from './helper';
import { ComponentName } from './interfaces/componentNames';
import {
  ApplicationStates,
  EnvironmentComponent,
  PlatformData,
  CussInit
} from "./interfaces/models";

export class CussLogic extends HttpRequests {
  /**
   * Bootstrap function used to hydrate all required values in order to interact with a CUSS 2 platform
   * @param info 
   * @returns 
   */
  init(info: CussInit): CussLogic {
    if (this.initCompleted.getValue()) {
      logger("Init method was already called");
      return this;
    }
    this.clientId.next(info.clientId);
    this.clientSecret.next(info.clientSecret);
    this.baseURL = info.baseURL;
    this.requiredComponents = info.requiredComponents || [];
    this.oauthURL = info.oauthURL || info.baseURL;
    this.initCompleted.next(true);
    const autoStart = typeof info.autoStart !== 'undefined' ? info.autoStart : true;
    logConfig.enable = typeof info.debugEnabled !== 'undefined' ? info.debugEnabled : false;
    if (autoStart) {
      this.cussAutoStart();
    }
    return this;
  }

  async cussAutoStart() {
    
    const token = await this.getToken();
    await this.getListener(token);
    this.setMessageHandler();

    this.components$.subscribe(async () => {
      await this.queryComponents();
    });
    this.queryCompleted.subscribe((completed: boolean) => {
      if (completed && this.requiredComponents.length) {
        this.findRequiredComponents(this.requiredComponents);
      }
    });
    this.listenerCreated.subscribe(async (created) => {
      if (created) {
        logger("Listener created");
        await this.getEnvironment();
        this.getComponents();
      }
    });

  }

  /**
   * Creating a handler for the events coming from the cuss platform
   */
  setMessageHandler() {
    this.cussEvents.subscribe((ev: PlatformData) => {
      logger("CUSS", ev);
      if (ev.functionName === "environment" && ev.environmentLevel) {
        this.environment$.next(ev.environmentLevel);
        logger("Environment", ev.environmentLevel);
        this.environmentReceived.next(true);
      }
      if (ev.functionName === "components" && ev.componentList) {
        // keep a list of all available components ids
        this.queryPending = ev.componentList.map((d) => d.id);
        this.components$.next(ev.componentList);
        this.componentsReceived.next(true);
      }
      if (ev.functionName === "query") {
        this.updateDeviceState(ev);
      }
      if (ev.currentApplicationState === ApplicationStates.AVAILABLE) {
        this.availableEventReceived.next(true);
      }
      if (ev.currentApplicationState === ApplicationStates.UNAVAILABLE) {
        this.unavailableEventReceived.next(true);
      }
      this.listenerHandlerCreated.next(true);
    });
  }

  /**
   * Update device status after queries or device changes and triggers the query_completed event when is done
   * @param ev CUSSEvent events coming from cuss platform
   */
  updateDeviceState(ev: EnvironmentComponent) {
    const found = this.components$
      .getValue()
      .find((c) => c.componentID === ev.componentID);
    if (found) {
      found["statusCode"] = ev.statusCode;
      found["eventCode"] = ev.eventCode;
      logger("new Device", found);
      this.queryPending.splice(this.queryPending.indexOf(found.id), 1);
      // Hydrate component names
      if (!found.componentName) {
        getCompomentName(found);
      }
    }
    if (this.queryPending.length === 0) {
      this.queryCompleted.next(true);
    }
  }

  /**
   * Check the availability of the required components and triggers the component_validation_completed when is done
   * @param requiredComponents required components for the application
   */
  findRequiredComponents(requiredComponents: ComponentName[]) {
    logger(requiredComponents);
    const platformComponentList = this.components$.getValue();
    this.componentValidationCompleted.next({
      completed: true,
      requiredComponentPresent: (platformComponentList.filter(c => requiredComponents.find(r => r === c.componentName && c.active)).length == requiredComponents.length),
      platformComponentList
    })
  }
}
