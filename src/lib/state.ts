import { BehaviorSubject } from "rxjs";
import {
  ApplicationActivation,
  EnvironmentComponent,
  PlatformData
} from "./interfaces/models";
import { ValidationResponse } from "./interfaces/validationResponse";
import { EnvironmentLevel } from "./interfaces/environmentLevel";
import { RequiredDevices } from "./interfaces/requiredDevices";

export class State {
  baseURL: string = "";
  oauthURL: string = "";
  socket: any;
  queryPending: any[] = [];
  requiredComponents: RequiredDevices[] = [];
  default_applicationBrand: string = "";
  default_executionMode: ApplicationActivation.ExecutionModeEnum =
    ApplicationActivation.ExecutionModeEnum.MAM;
  default_accessibleMode: boolean = false;
  default_executionOptions: string = "";
  default_languageID: string = "en-US";
  default_transferData: string = "";
  /**
   * Triggers when the application call the init function with the correct values
   */
  init_completed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  client_id: BehaviorSubject<string> = new BehaviorSubject<string>("");
  client_secret: BehaviorSubject<string> = new BehaviorSubject<string>("");

  /**
   * Help track the retriving of the authentication token
   */
  token_received: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  token: BehaviorSubject<string> = new BehaviorSubject<string>("");

  /**
   * Event tracking when a listener is created
   */
  listener_created: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Event tracking when a listener handlers are defined
   */
  listener_handler_created: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Events subscriptions coming from CUSS Platform
   */
  cuss_events: BehaviorSubject<PlatformData> = new BehaviorSubject<
    PlatformData
  >({});

  /**
   * CUSS Websocket connection got disconnected
   */
  close_socket: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /**
   * Components Subscription triggers when components data is received from CUSS Platform
   */
  components$: BehaviorSubject<EnvironmentComponent[]> = new BehaviorSubject<
    EnvironmentComponent[]
  >([]);
  components_received: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Environment Subscription triggers when the environment data is received from CUSS Platform
   */
  environment$: BehaviorSubject<EnvironmentLevel> = new BehaviorSubject<
    EnvironmentLevel
  >({});
  environment_received: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Subcription tiggres when all compenet queries are received from CUSS Platform
   */
  query_completed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Subcription tiggres when all application required components are verified
   */
  component_validation_completed: BehaviorSubject<
    ValidationResponse
  > = new BehaviorSubject<ValidationResponse>({
    completed: false,
    requiredComponents: []
  });
  /**
   * Subject trigger when the available event gets returns from the cuss platform
   */
  available_event_received: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the available event gets returns from the cuss platform
   */
  unavailable_event_received: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the active event gets returns from the cuss platform
   */
  active_event_received: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the stopped event gets returns from the cuss platform
   */
  stopped_event_received: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the suspended event gets returns from the cuss platform
   */
  suspended_event_received: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the wrong state event gets returns from the cuss platform
   */
  wrong_state_event_received: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Application is ready to move to AVAILABLE
   */
  app_ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /**
   * Application was unable to find all required devices or required devices became unhealthy
   */
  app_failed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
}
