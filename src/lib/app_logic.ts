import { componentFinder } from "./component-finder";
import { HttpRequests } from "./http_requests";
import { logger, logConfig } from './helper';
import {
  ApplicationStates,
  EnvironmentComponent,
  PlatformData,
  RequiredDevices,
  CussInit
} from "./interfaces/models";

export class CussLogic extends HttpRequests {
  /**
   * Bootstrap function used to hydrate all required values in order to interact with a CUSS 2 platform
   * @param info 
   * @returns 
   */
  init(info: CussInit): CussLogic {
    if (this.init_completed.getValue()) {
      logger("Init method was already called");
      return this;
    }
    this.client_id.next(info.clientId);
    this.client_secret.next(info.clientSecret);
    this.baseURL = info.baseURL;
    this.requiredComponents = info.requiredComponents || [];
    this.oauthURL = info.oauthURL || info.baseURL;
    this.init_completed.next(true);
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
    this.query_completed.subscribe((completed: boolean) => {
      if (completed && this.requiredComponents.length) {
        this.findRequiredComponents(this.requiredComponents);
      }
    });
    this.listener_created.subscribe(async (created) => {
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
    this.cuss_events.subscribe((ev: PlatformData) => {
      logger("CUSS", ev);
      if (ev.functionName === "environment" && ev.environmentLevel) {
        this.environment$.next(ev.environmentLevel);
        logger("Environment", ev.environmentLevel);
        this.environment_received.next(true);
      }
      if (ev.functionName === "components" && ev.componentList) {
        // keep a list of all available components ids
        this.queryPending = ev.componentList.map((d) => d.id);
        this.components$.next(ev.componentList);
        this.components_received.next(true);
      }
      if (ev.functionName === "query") {
        this.updateDeviceState(ev);
      }
      if (ev.currentApplicationState === ApplicationStates.AVAILABLE) {
        this.available_event_received.next(true);
      }
      if (ev.currentApplicationState === ApplicationStates.UNAVAILABLE) {
        this.unavailable_event_received.next(true);
      }
      this.listener_handler_created.next(true);
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
    }
    if (this.queryPending.length === 0) {
      this.query_completed.next(true);
    }
  }

  /**
   * Check the availability of the required components and triggers the component_validation_completed when is done
   * @param requiredComponents required components for the application
   */
  findRequiredComponents(requiredComponents: RequiredDevices[]) {
    logger(requiredComponents);
    componentFinder(requiredComponents, this.components$.getValue()).finally(
      () =>
        this.component_validation_completed.next({
          completed: true,
          requiredComponents
        })
    );
  }
}
