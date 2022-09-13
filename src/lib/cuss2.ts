
import { log, logger, helpers, LogMessage } from "./helper";
import {EnvironmentLevel} from "./interfaces/environmentLevel";
import {PlatformData} from "./interfaces/platformData";
import {BehaviorSubject, Subject} from "rxjs";
import {ApplicationStates} from "./interfaces/applicationStates";
import AppState = ApplicationStates.ApplicationStateCodeEnum;
import ChangeReason = ApplicationStates.ApplicationStateChangeReasonCodeEnum;
import {ComponentList} from "./interfaces/componentList";

import {Connection} from "./connection";
import {DataExchange} from "./interfaces/dataExchange";

import {
	Announcement,
	BarcodeReader,
	Component, Dispenser,
	DocumentReader, Feeder,
	Keypad,
	CardReader,
	BagTagPrinter,
	BoardingPassPrinter, Illumination, Headset
} from "./models/component";
import { CUSSDataTypes } from "./interfaces/cUSSDataTypes";
import {StateChange} from "./models/stateChange";
import {ComponentInterrogation} from "./componentInterrogation";
import {ApplicationActivation} from "./interfaces/applicationActivation";
import ExecutionModeEnum = ApplicationActivation.ExecutionModeEnum;

const {
	isAnnouncement,
	isFeeder,
	isDispenser,
	isBagTagPrinter,
	isBoardingPassPrinter,
	isDocumentReader,
	isBarcodeReader,
	isCardReader,
	isKeypad, isIllumination, isHeadset
} = ComponentInterrogation;

/**
 * @function validateComponentId
 * @param {number} componentID - The componentID to validate
 * @throws {Error} If the componentID is not a number
 */
function validateComponentId(componentID:any) {
	if (typeof componentID !== 'number') {
		throw new TypeError('Invalid componentID: ' + componentID);
	}
}

/**
 * @class Class to create a CUSS 2 object, used it interface with a cuss platform.
 * @property {connection} connection - The connection object used to communicate with the cuss platform.
 * @property {EnvironmentLevel} environmentLevel - The environment level of the cuss platform. *Note* see IATA docs for more details.
 * @property {any | undefined} components - The components of the cuss platform.
 * @property {BehaviorSubject<Component|null>} stateChange - The state change subject that emits when the application state changes.
 * @property {BehaviorSubject<any>} componentStateChange - The component change subject emits when a component's state changes.
 * @property {Subject<PlatformData>} onmessage - The onmessage subject for unsolicited and solicited events. *Note* see IATA docs for more details.
 * @property {BagTagPrinter} bagTagPrinter - The bag tag printer component class to interact with the device.
 * @property {BoardingPassPrinter} boardingPassPrinter - The boarding pass printer component class to interact with the device.
 * @property {DocumentReader} documentReader - The document reader component class to interact with the device.
 * @property {BarcodeReader} barcodeReader - The barcode reader component class to interact with the device.
 * @property {Announcement} announcement - The announcement component class to interact with the device.
 * @property {Keypad} keypad - The keypad component class to interact with the device.
 * @property {CardReader} cardReader - The card reader component class to interact with the device.
 * @property {Subject<undefined>} activated - The activated subject will emit when the application moves to the active state.
 * @property {Subject<AppState>} deactivated - The deactivated subject emits when the application is moved from the active state. *Note* see IATA docs for more details. AppState is an alias for ApplicationStateCodeEnum.
 * @property {AppState} pendingStateChange - The  application pending state change. *Note* see IATA docs for more details.
 * @property {boolean} multiTenant - The multi tenant flag.
 * @property {boolean} accessibleMode - The accessible mode flag.
 * @property {string} language - The language.
 * 
 * @example
 * // Connect to the cuss platform
 * this.cuss2.connection
 * @example
 * // Get the  current environment level
 * this.cuss2.environmentLevel
 * @example
 * // Get the components
 * this.cuss2.components
 * @example
 * // Subscribe to the state change subject
 * this.cuss2.stateChange.subscribe(stateChange => {
 * 	// Do something with the state change
 * });
 * @example
 * // Subscribe to the component state change subject
 * this.cuss2.componentStateChange.subscribe(componentStateChange => {
 * 	// Do something with the component state change
 * });
 * @example
 * // Subscribe to the onmessage subject
 * this.cuss2.onmessage.subscribe(onmessage => {
 * 	// Do something with the platform data
 * });
 * @example
 * // Get the bag tag printer object
 * // click here for more info
 * this.cuss2.bagTagPrinter
 * @example
 * // Get the boarding pass printer object
 * // click here for more info
 * this.cuss2.boardingPassPrinter
 * @example
 * // Get the document reader object
 * // click here for more info
 * this.cuss2.documentReader
 * @example
 * // Get the barcode reader object
 * // click here for more info
 * this.cuss2.barcodeReader
 * @example
 * // Get the announcement object
 * // click here for more info
 * this.cuss2.announcement
 * @example
 * // Get the keypad object
 * // click here for more info
 * this.cuss2.keypad
 * @example
 * // Get the card reader object
 * // click here for more info
 * this.cuss2.cardReader
 * @example
 * // Get the activated subject
 * this.cuss2.activated.subscribe(() => {
 * 	// Do something when the application is activated
 * });
 * @example
 * // Get the deactivated subject
 * this.cuss2.deactivated.subscribe((appState) => {
 * 	// Do something when the application is deactivated
 * });
 * @example
 * // Get the pending state change
 * this.cuss2.pendingStateChange
 * @example
 * // Get the multi tenant flag
 * this.cuss2.multiTenant
 * @example
 * // Get the accessible mode flag
 * this.cuss2.accessibleMode
 * @example
 * // Get the language
 * this.cuss2.language
 */
export class Cuss2 {

	/**
	 * @memberof Cuss2
	 * @method connect - Connect to the cuss platform.
	 * @param {string} url  - The url of the CUSS 2 platform
	 * @param {string} client_id  - The client_id of the CUSS 2 platform
	 * @param {string} client_secret  - The client_secret of the CUSS 2 platform
	 * @param {Object} [options={}] - An object of options passed in for the connection
	 * @returns {Promise<Cuss2>} A promise that resolves to a Cuss2 object
	 * @example
	 * const connect = await Cuss2.connect('url', 'client_id', 'client_secret', "options");
	 * 
	 */
	static async connect(url: string, client_id: string, client_secret: string, options: any = {}): Promise<Cuss2> {
		document.body.setAttribute('elevated-cuss2', '1')
		function broadcast(detail: any) {
			const event = new CustomEvent('send_to_cuss2_devtools', {detail});
			window.dispatchEvent(event);
		}
		Cuss2.logger.subscribe(broadcast);

		const connection = await Connection.connect(url, client_id, client_secret,  options);
		const cuss2 = new Cuss2(connection);

		if (document.body.hasAttribute('cuss2-devtools')) {
			console.log('cuss2-devtools detected');
			// @ts-ignore
			window.addEventListener("execute_from_cuss2_devtools", async ({detail: {id, cmd, args=[]}}) => {
				console.log('EVENT:execute_from_cuss2_devtools', cmd, args)
				if (!cmd) return;
				const parts = cmd.split('.')
				let error, response, target = Cuss2._get(cuss2, parts);
				if (typeof target === 'function') {
					// @ts-ignore
					const parent = Cuss2._get(cuss2, parts.slice(0, -1));
					try {
						// @ts-ignore
						response = target.apply(parent, args);
						if (response instanceof Promise)
							response = await response;
					}
					catch(e) {error = e}
				}
				else response = target;
				broadcast({id, cmd, response, error});
			}, false);
		}

		await cuss2._initialize();
		return cuss2;
	}
	static _get(cuss2: Cuss2, parts: String[]) {
		// @ts-ignore
		return parts.reduce((obj, prop) => obj && obj[prop], cuss2)
	}

	static log = log;
	static logger: Subject<LogMessage> = logger;
	static helpers = helpers;

	private constructor(connection: Connection) {
		this.connection = connection;
		// Subscribe to messages from the CUSS 2 platform
		connection.messages.subscribe(async e => await this._handleWebSocketMessage(e))
		// Subscribe to the connection being closed and attempt to reconnect
		connection.onclose.subscribe(async () => {
			await connection._connect();
			await this._initialize();
		});
	}

	connection:Connection;
	environment: EnvironmentLevel = {} as EnvironmentLevel;
	components: any|undefined = undefined;
	stateChange: BehaviorSubject<StateChange> = new BehaviorSubject<StateChange>(new StateChange(AppState.STOPPED, AppState.STOPPED));
	componentStateChange: BehaviorSubject<Component|null> = new BehaviorSubject<Component|null>(null);
	onmessage: Subject<PlatformData> = new Subject<PlatformData>();

	bagTagPrinter?: BagTagPrinter;
	boardingPassPrinter?: BoardingPassPrinter;
	documentReader?: DocumentReader;
	barcodeReader?: BarcodeReader;
	announcement?: Announcement;
	keypad?: Keypad;
	cardReader?: CardReader;
	activated: Subject<ApplicationActivation> = new Subject<ApplicationActivation>();
	deactivated: Subject<AppState> = new Subject<AppState>();
	pendingStateChange?: AppState;
	multiTenant?: boolean;
	accessibleMode: boolean = false;
	language?: string;

  /**
	* @typeof {StateChange.current} state Get the current application state from the CUSS 2 platform
	* @returns {AppState} The current application state
  */
	get state() {
		return this.stateChange.getValue().current;
	}

	async _initialize(): Promise<any> {
		log("info", "Getting Environment Information");
		await this.api.getEnvironment();
		if (!this.state) {
			throw new Error('Platform in abnormal state.');
		}
		if (this.state === AppState.SUSPENDED) {
			throw new Error('Platform has SUSPENDED the application');
		}
		log("info", "Getting Component List");
		await this.api.getComponents();
		await this.requestUnavailableState();
		this.queryComponents().catch(e => log("error",'error querying components', e))
	}

	async _handleWebSocketMessage(data: DataExchange) {
		const message = data && data.toApplication;
		if (!message || message.statusCode === undefined) return; // initial value is an empty value

		log('verbose', '[event.currentApplicationState]', message.currentApplicationState);

		const unsolicited = !message.functionName;

		let currentState:any = message.currentApplicationState;

		// TODO: remove when platform and cuss2.js are upgraded to Aug 22 CUSS2 updates.
		// applicationStateCode was an enumeration; the update
		// changed it to an object with the value we need nested inside.
		if (currentState && typeof currentState !== 'string') {
			currentState = currentState.applicationStateCode
		}
		if(!currentState) {
			this.connection._socket?.close();
			throw new Error('Platform in invalid state. Cannot continue.');
		}
		if(currentState !== this.state) {
			const prevState = this.state;
			log('verbose', `[state changed] old:${prevState} new:${currentState}`);
			this.stateChange.next(new StateChange(prevState, currentState as AppState));

			if (currentState === AppState.UNAVAILABLE) {
				await this.queryComponents().catch(e => log('verbose', 'failed to queryComponents', e));
				if (this._online) {
					this.checkRequiredComponentsAndSyncState();
				}
			}
			else if (currentState === AppState.ACTIVE) {
				if (!message.applicationActivation)
					throw new Error('ApplicationActivation missing')
				this.multiTenant = message.applicationActivation?.executionMode === ExecutionModeEnum.MAM;
				this.accessibleMode = message.applicationActivation?.accessibleMode || false;
				this.language = message.applicationActivation?.languageID;
				this.activated.next(message.applicationActivation);
			}
			if (prevState === AppState.ACTIVE) {
				this.deactivated.next(currentState as AppState);
			}
		}

		if(typeof message.componentID === 'number' && this.components) {
			const component = this.components[message.componentID];
			if (component && component.stateIsDifferent(message)) {
				component.updateState(message);
				this.componentStateChange.next(component);
				if (this._online && (unsolicited || message.functionName === 'query')) {
					this.checkRequiredComponentsAndSyncState();
				}
			}
		}

		log('verbose', "[socket.onmessage]", message);

		this.onmessage.next(message)
	}

	api = {
		//
		// "GET" calls
		//

		/**
		 * Get the current environment level.
		 * @memberof Cuss2
		 * @method getEnvironment
		 * @returns {Promise<EnvironmentLevel>} - The current environment level. *Note* see IATA docs for more details.
		 * @example
		 * // *Note* see IATA docs for more details.
		 * const environment = await cuss2.getEnvironment();
		 */
		getEnvironment: async (): Promise<EnvironmentLevel> => {
			const response = await this.connection.get('/platform/environment');
			log('verbose', '[getEnvironment()] response', response);
			this.environment = response.environmentLevel as EnvironmentLevel;
			return this.environment;
		},
		/**
		 * Get a list of components.
		 * @memberof Cuss2
		 * @method getComponents
		 * @returns {Promise<ComponentList>} - The list of components
		 * @example
		 * const components = await cuss2.getComponents();
		 */
		getComponents: async (): Promise<ComponentList> => {
			const response = await this.connection.get('/platform/components');
			log('verbose', '[getComponents()] response', response);
			const componentList = response.componentList as ComponentList;
			if (this.components) return componentList;

			const components:any = this.components = {};

			//first find feeders & dispensers so they can be linked when printers are created
			componentList.forEach((component) => {
				const id = String(component.componentID);
				let instance;

				if (isFeeder(component)) instance = new Feeder(component, this);
				else if (isDispenser(component)) instance = new Dispenser(component, this);
				else return;

				return components[id] = instance;
			});

			componentList.forEach((component) => {
				const id = String(component.componentID);
				let instance;

				if (isAnnouncement(component)) instance = this.announcement = new Announcement(component, this);
				else if (isBagTagPrinter(component)) instance = this.bagTagPrinter = new BagTagPrinter(component, this);
				else if (isBoardingPassPrinter(component)) instance = this.boardingPassPrinter = new BoardingPassPrinter(component, this);
				else if (isDocumentReader(component)) instance = this.documentReader = new DocumentReader(component, this);
				else if (isBarcodeReader(component)) instance = this.barcodeReader = new BarcodeReader(component, this);
				else if (isCardReader(component)) instance = this.cardReader = new CardReader(component, this);
				else if (isKeypad(component)) instance = this.keypad = new Keypad(component, this);
				// subcomponents
				else if (isFeeder(component))  return; // instance = new Feeder(component, this);
				else if (isDispenser(component))  return; // instance = new Dispenser(component, this);
				else if (isIllumination(component)) instance = new Illumination(component, this);
				else if (isHeadset(component)) instance = new Headset(component, this);
				else instance = new Component(component, this);

				return components[id] = instance;
			});

			return componentList;
		},
		/**
		 * Get the status of a given component (device).
		 * @memberof Cuss2
		 * @method getStatus
		 * @param {number} componentID - The ID of the desired device 
		 * @returns {Promise<PlatformData>} - The status of the component. *Note* see IATA docs for more details.
		 * @example
		 * const status = await cuss2.getStatus(componentID);
		 */
		getStatus: async (componentID:number): Promise<PlatformData> => {
			const response = await this.connection.get('/peripherals/query/' + componentID);
			log('verbose', '[queryDevice()] response', response);
			return response as PlatformData;
		},

		/**
		 * Send a command to a given component (device).
		 * @memberof Cuss2
		 * @method send
		 * @param {number} componentID - The ID of the desired device
		 * @param dataExchange - Object to exchange data between the application and platform. *Note* see IATA docs for more details.
		 * @returns {Promise<PlatformData>} *Note* see IATA docs for more details.
		 * @example
		 * const setup = await cuss2.send(componentID, dataExchange);
		 */
		send: async (componentID:number, dataExchange:DataExchange): Promise<PlatformData> => {
			return this.connection.post('/peripherals/send/' + componentID, dataExchange);
		},
		/**
		 * Send setup instructions to a given component (device).
		 * @memberof Cuss2
		 * @method setup
		 * @param {number} componentID - The ID of the desired device 
		 * @param dataExchange - Object to exchange data between the application and platform. *Note* see IATA docs for more details.
		 * @returns {Promise<PlatformData>} *Note* see IATA docs for more details.
		 * @example
		 * const status = await cuss2.setup(componentID, dataExchange);
		 */
		setup: async (componentID:number, dataExchange:DataExchange): Promise<PlatformData> => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/setup/' + componentID, dataExchange);
		},
		/**
		 * Sends a cancel command to a given component (device).
		 * @memberof Cuss2
		 * @method cancel
		 * @param {number} componentID - The ID of the desired device 
		 * @returns {Promise<PlatformData>} *Note* see IATA docs for more details.
		 * @example
		 * const statusCancel = await cuss2.cancel(componentID);
		 */
		cancel: async (componentID:number): Promise<PlatformData> => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/cancel/' + componentID);
		},

		/*
		*		/peripherals/userpresent/XXXXX
		*/
		/**
		 * Sends enable command to a given component (device).
		 * @memberof Cuss2
		 * @method enable
		 * @param {number} componentID - The ID of the desired device
		 * @returns {Promise<PlatformData>} *Note* see IATA docs for more details.
		 * @example
		 * const statusEnable = await cuss2.enable(componentID);
		 */
		enable: async (componentID:number): Promise<PlatformData> => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/userpresent/enable/' + componentID);
		},
		/**
		 * Sends disable command to a given component (device).
		 * @memberof Cuss2
		 * @method disable
		 * @param {number} componentID - The ID of the desired device
		 * @returns {Promise<PlatformData>} *Note* see IATA docs for more details.
		 * @example
		 * const statusDisable = await cuss2.disable(componentID);
		 */
		disable: async (componentID:number): Promise<PlatformData> => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/userpresent/disable/' + componentID);
		},
		offer: async (componentID:number): Promise<PlatformData> => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/userpresent/offer/' + componentID);
		},

		/**
		 * Sends request to the platform for the application to change states.
		 * @memberof Cuss2
		 * @method staterequest
		 * @param {AppState} state - The state to change to.
		 * @param {ChangeReason} reasonCode - The enumerated reasonCode for the state change.
		 * @param {string} reason - The reason for the state change.
		 * @returns {Promise<PlatformData|undefined>} Response from the platform. *Note* see IATA docs for more details.
		 * @example
		 * const startRequest = await cuss2.staterequest(state, reasonCode, reason);
		 */
		staterequest: async (state: AppState, reasonCode = ChangeReason.NOTAPPLICABLE, reason = ''): Promise<PlatformData|undefined> => {
			if (this.pendingStateChange) {
				return Promise.resolve(undefined);
			}
			log("info", `Requesting ${state} state`);
			this.pendingStateChange = state;
			let response:PlatformData|undefined;
			try {
				response = await this.connection.post('/platform/applications/staterequest', {
					"applicationStateCode": state,
					"applicationStateChangeReasonCode": reasonCode,
					"applicationStateChangeReason": reason
				})
					.catch(e => {
						// API is returning AL_APPLICATION_REQUEST instead of OK. Suppress it...
						if (e.statusCode !== 'AL_APPLICATION_REQUEST') {
							throw e;
						}
						return e;
					});
				return response;
			}
			finally {
				this.pendingStateChange = undefined;
			}
		},

		/*
		*		/peripherals/announcement/XXXXX
		*/
		/**
		 * Sends announcement to a given component (device).
		 * 
		 * @memberof Cuss2
		 * @namespace announcement
		 * @method announcement
		 * @param {number} componentID - The ID of the desired device
		 * @param {string} rawData - The message to send
		 * @returns {Promise<PlatformData>} *Note* see IATA docs for more details.
		 * @property {method} play - Play the announcement.
		 * @example
		 * const play = await cuss2.announcement.play(componentID, rawData);
		 * @property {method} pause - Pause the announcement.
		 * @example
		 * const stop = await cuss2.announcement.stop(componentID);
		 * @property {method} resume - Resume the announcement.
		 * @example
		 * const resume = await cuss2.announcement.resume(componentID);
		 * @property {method} stop - Stop the announcement.
		 * @example
		 * const stop = await cuss2.announcement.stop(componentID);
		 */
		announcement: {
			/**
			 * @memberof Cuss2.announcement
			 */
			play: async (componentID:number, rawData:string): Promise<PlatformData> => {
				validateComponentId(componentID);
				const dataExchange = {
					toPlatform: {
						dataRecords: [ { data: rawData as any, dsTypes: [ CUSSDataTypes.SSML10 ] } ]
					},
				} as DataExchange;
				return await this.connection.post('/peripherals/announcement/play/' + componentID, dataExchange);
			},

			/**
			 * @memberof Cuss2.announcement
			 */
			pause: async (componentID:number): Promise<PlatformData> => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/pause/' + componentID);
			},

			/**
			 * @memberof Cuss2.Announcement
			 */
			resume: async (componentID:number): Promise<PlatformData> => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/resume/' + componentID);
			},

			/**
			 * @memberof Cuss2.announcement
			 */
			stop: async (componentID:number): Promise<PlatformData> => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/stop/' + componentID);
			}
		}
	};

	//
	// State requests. Only offer the ones that are valid to request.
	//
	/**
	 * Request the platform to change the application state to Available state.
	 * @memberof Cuss2
	 * @method requestActiveState
	 * @returns {Promise<PlatformData|undefined>} Response from the platform. *Note* see IATA docs for more details.
	 * @example
	 * const requestActiveState = await cuss2.requestActiveState();
	 */
	async requestAvailableState(): Promise<PlatformData|undefined> {
		// allow hoping directly to AVAILABLE from INITIALIZE
		if (this.state === AppState.INITIALIZE) {
			await this.requestUnavailableState();
		}
		const okToChange = this.state === AppState.UNAVAILABLE || this.state === AppState.ACTIVE;
		
		if (okToChange && this.state === AppState.ACTIVE) {
			if (this.components) {
				const componentList = Object.values(this.components) as Component[];
				componentList.forEach(async (component: Component) => {
					if (component.enabled) {
						await component.disable();
					}
				});
			}
		}

		return okToChange ? this.api.staterequest(AppState.AVAILABLE) : Promise.resolve(undefined);
	}
	/**
	 * Request the platform to change the application state to Unavailable state.
	 * @memberof Cuss2
	 * @method requestUnavailableState
	 * @returns {Promise<PlatformData|undefined>} Response from the platform. *Note* see IATA docs for more details.
	 * @example
	 * const requestUnavailableState = await cuss2.requestUnavailableState();
	 */
	requestUnavailableState(): Promise<PlatformData|undefined> {
		const okToChange = this.state === AppState.INITIALIZE || this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;

		if (okToChange && this.state === AppState.ACTIVE) {
			if (this.components) {
				const componentList = Object.values(this.components) as Component[];
				componentList.forEach(async (component: Component) => {
					if (component.enabled) {
						await component.disable();
					}
				});
			}
		}
		
		return okToChange ? this.api.staterequest(AppState.UNAVAILABLE) : Promise.resolve(undefined);
	}
	/**
	 * Request the platform to change the application state to Stopped state.
	 * @memberof Cuss2
	 * @method requestStoppedState
	 * @returns {Promise<PlatformData|undefined>} Response from the platform. *Note* see IATA docs for more details.
	 * @example
	 * const requestStoppedState = await cuss2.requestStoppedState();
	 */
	requestStoppedState(): Promise<PlatformData|undefined> {
		return this.api.staterequest(AppState.STOPPED);
	}
	/**
	 * Request the platform to change the application state to Active state.
	 * @memberof Cuss2
	 * @method requestActiveState
	 * @returns {Promise<PlatformData|undefined>} Response from the platform.
	 * @example
	 * const requestActiveState = await cuss2.requestActiveState();
	 */
	requestActiveState(): Promise<PlatformData|undefined> {
		const okToChange = this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
		return okToChange ? this.api.staterequest(AppState.ACTIVE) : Promise.resolve(undefined);
	}
	/**
	 * Request the platform to reload the application.
	 * @memberof Cuss2
	 * @method requestReload
	 * @returns {Promise<boolean>} Response from the platform whether it can reload or not.
	 * @example
	 * const requestReload = await cuss2.requestReload();
	 */
	async requestReload(): Promise<boolean> {
		const okToChange = !this.state || this.state === AppState.UNAVAILABLE || this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
		if (!okToChange) {
			return Promise.resolve(false);
		}

		await this.api.staterequest(AppState.RELOAD);
		this.connection._socket?.close();
		return true;
	}

	/**
	 * Query each component for its current state.
	 * @memberof Cuss2
	 * @method queryComponents
	 * @returns {Promise<boolean>} Response from the platform, whether the query was able to be sent or not.
	 * @example
   * const queryComponents = await cuss2.queryComponents();
	 */
	async queryComponents(): Promise<boolean> {
		if (!this.components) {
			return false;
		}
		const componentList = Object.values(this.components) as Component[];
		await Promise.all(
			componentList.map(c => c.query()
				.catch(e => e)) //it rejects statusCodes that are not "OK" - but here we just need to know what it is, so ignore
			)
		return true;
	}

	/**
	 * 
	 * @typeof unavailableComponents
	 * @returns {Component[]} List of unavailable components.
	 */
	get unavailableComponents(): Component[] {
		const components = Object.values(this.components) as Component[];
		return components.filter((c:Component) => !c.ready);
	}
	/**
	 * @typeof unavailableRequiredComponents
	 * @returns {Component[]} List of unavailable components that have been marked required.
	 */
	get unavailableRequiredComponents(): Component[] {
		return this.unavailableComponents.filter((c:Component) => c.required)
	}

	/**
	 * Check if all required components are available and move application to the appropriate state based on their status.
	 * @memberof Cuss2
	 * @method checkRequiredComponentsAndSyncState
	 * @example
	 * cuss2.checkRequiredComponentsAndSyncState();
	 */
	checkRequiredComponentsAndSyncState(): void {
		if (this.pendingStateChange) return;
		if (this._online) {
			const inactiveRequiredComponents = this.unavailableRequiredComponents;
			if (!inactiveRequiredComponents.length) {
				if (this.state === AppState.UNAVAILABLE) {
					log('verbose', '[checkRequiredComponentsAndSyncState] All required components OK ✅. Ready for AVAILABLE state.');
					this.requestAvailableState();
				}
			}
			else {
				log('verbose', '[checkRequiredComponentsAndSyncState] Required components UNAVAILABLE:', inactiveRequiredComponents.map((c: Component) => c.constructor.name));
				this.requestUnavailableState();
			}
		}
		else if (this.components) {
			this.requestUnavailableState();
		}
	}

	_online: boolean = false;
	get applicationOnline() { return this._online; }
	set applicationOnline(online:boolean) {
		this._online = online;
		this.checkRequiredComponentsAndSyncState();
	}
}

export * from "./models/component";
export * from "./models/stateChange";
export * from "./helper";
export * from "./componentInterrogation";
