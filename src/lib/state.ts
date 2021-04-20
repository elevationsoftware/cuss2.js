import { BehaviorSubject } from "rxjs";
import {
  ApplicationActivation,
  EnvironmentComponent,
  PlatformData
} from "./interfaces/models";
import { ValidationResponse } from "./interfaces/validationResponse";
import { EnvironmentLevel } from "./interfaces/environmentLevel";
import { ComponentName } from './interfaces/componentNames';
import { MissingResponse } from './interfaces/missingResponse';

export class State {
  baseURL: string = "";
  oauthURL: string = "";
  socket: any;
  queryPending: any[] = [];
  requiredComponents: ComponentName[] = [];
  defaultApplicationBrand: string = "";
  defaultExecutionMode: ApplicationActivation.ExecutionModeEnum =
    ApplicationActivation.ExecutionModeEnum.MAM;
  defaultAccessibleMode: boolean = false;
  defaultExecutionOptions: string = "";
  defaultLanguageID: string = "en-US";
  defaultTransferData: string = "";
  /**
   * Triggers when the application call the init function with the correct values
   */
  initCompleted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  clientId: BehaviorSubject<string> = new BehaviorSubject<string>("");
  clientSecret: BehaviorSubject<string> = new BehaviorSubject<string>("");

  /**
   * Help track the retriving of the authentication token
   */
  tokenReceived: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  token: BehaviorSubject<string> = new BehaviorSubject<string>("");

  /**
   * Event tracking when a listener is created
   */
  listenerCreated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Event tracking when a listener handlers are defined
   */
  listenerHandlerCreated: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Events subscriptions coming from CUSS Platform
   */
  cussEvents: BehaviorSubject<PlatformData> = new BehaviorSubject<
    PlatformData
  >({});

  /**
   * CUSS Websocket connection got disconnected
   */
  closeSocket: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /**
   * Components Subscription triggers when components data is received from CUSS Platform
   */
  components$: BehaviorSubject<EnvironmentComponent[]> = new BehaviorSubject<
    EnvironmentComponent[]
  >([]);
  componentsReceived: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Environment Subscription triggers when the environment data is received from CUSS Platform
   */
  environment$: BehaviorSubject<EnvironmentLevel> = new BehaviorSubject<
    EnvironmentLevel
  >({});
  environmentReceived: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Subcription tiggres when all compenet queries are received from CUSS Platform
   */
  queryCompleted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Subcription tiggres when all application required components are verified
   */
  componentValidationCompleted: BehaviorSubject<
    ValidationResponse
  > = new BehaviorSubject<ValidationResponse>({
    completed: false,
    requiredComponentPresent: false,
    platformComponentList: []
  });

  /**
   * Triggers when all required components requested by the clients are found
   */
  requiredComponentsFound: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  /**
   * Triggers when all required components requested by the clients are found
   */
   requiredComponentsMissing: BehaviorSubject<MissingResponse> = new BehaviorSubject<MissingResponse>({
     missing: false,
     components: []
   });

  /**
   * Subject trigger when the available event gets returns from the cuss platform
   */
  availableEventReceived: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the available event gets returns from the cuss platform
   */
  unavailableEventReceived: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the active event gets returns from the cuss platform
   */
  activeEventReceived: BehaviorSubject<boolean> = new BehaviorSubject<
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
  suspendedEventReceived: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Subject trigger when the wrong state event gets returns from the cuss platform
   */
  wrongStateEventReceived: BehaviorSubject<boolean> = new BehaviorSubject<
    boolean
  >(false);
  /**
   * Application is ready to move to AVAILABLE
   */
  appReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /**
   * Application was unable to find all required devices or required devices became unhealthy
   */
  appFailed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
}
