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
import {ComponentTypes} from "./interfaces/componentTypes";
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
 * Class to create a CUSS 2 object, used it interface with a cuss platform.
 */
export class Cuss2 {

	/**
	 * @method connect
	 * @param {string} url  - The url of the CUSS 2 platform
	 * @param {string} client_id  - The client_id of the CUSS 2 platform
	 * @param {string} client_secret  - The client_secret of the CUSS 2 platform
	 * @param {Object} [options={}] - An object of options passed in for the connection
	 * @returns {Promise<Cuss2>} A promise that resolves to a Cuss2 object
	 */
	static async connect(url: string, client_id: string, client_secret: string, options: any = {}): Promise<Cuss2> {
		const connection = await Connection.connect(url, client_id, client_secret,  options);
		const cuss2 = new Cuss2(connection);
		await cuss2._initialize();
		return cuss2;
	}
	static log = log;
	static logger: Subject<LogMessage> = logger;
	static helpers = helpers;

	private constructor(connection: Connection) {
		this.connection = connection;
		/**
		 * Subscribe to messages from the CUSS 2 platform
		 */
		connection.messages.subscribe(async e => await this._handleWebSocketMessage(e))
		/**
		 * Subscribe to the connection being closed and attempt to reconnect
		 */
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
	activated: Subject<undefined> = new Subject<undefined>();
	deactivated: Subject<AppState> = new Subject<AppState>();
	pendingStateChange?: AppState;
	multiTenant?: boolean;
	accessibleMode: boolean = false;
	language?: string;

	/**
	 * @property {StateChange.current} state Get the current application state from the CUSS 2 platform
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

		const currentState = message.currentApplicationState?.toString();
		const unsolicited = !message.functionName;
		if(!currentState) {
			this.connection._socket?.close();
			throw new Error('Platform in invalid state. Cannot continue.');
		}
		if(currentState !== this.state) {
			const prevState = this.state;
			log('verbose', `[state changed] old:${prevState} new:${currentState}`);
			this.stateChange.next(new StateChange(prevState, currentState as AppState));

			if (this._online && currentState === AppState.UNAVAILABLE) {
				await this.queryComponents().catch(e => log('verbose', 'failed to queryComponents', e));
				this.checkRequiredComponentsAndSyncState();
			}
			else if (currentState === AppState.ACTIVE) {
				this.multiTenant = message.applicationActivation?.executionMode === ExecutionModeEnum.MAM;
				this.accessibleMode = message.applicationActivation?.accessibleMode || false;
				this.language = message.applicationActivation?.languageID;
				this.activated.next(undefined);
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
				if (unsolicited || message.functionName === 'query') {
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
		 * @returns {Promise<EnvironmentLevel>} - The current environment level
		 */
		getEnvironment: async (): Promise<EnvironmentLevel> => {
			const response = await this.connection.get('/platform/environment');
			log('verbose', '[getEnvironment()] response', response);
			this.environment = response.environmentLevel as EnvironmentLevel;
			return this.environment;
		},
		/**
		 * Get a list of components.
		 * @returns {Promise<ComponentList>} - The list of components
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
		 * @param {number} componentID - The ID of the desired device 
		 * @returns {Promise<PlatformData>} - The status of the component
		 */
		getStatus: async (componentID:number): Promise<PlatformData> => {
			const response = await this.connection.get('/peripherals/query/' + componentID);
			log('verbose', '[queryDevice()] response', response);
			return response as PlatformData;
		},

		/**
		 * Send a command to a given component (device).
		 * @param {number} componentID - The ID of the desired device
		 * @param dataExchange
		 * @returns {Promise<PlatformData>} 
		 */
		send: async (componentID:number, dataExchange:DataExchange): Promise<PlatformData> => {
			return this.connection.post('/peripherals/send/' + componentID, dataExchange);
		},
		/**
		 * Send setup instructions to a given component (device).
		 * @param {number} componentID - The ID of the desired device 
		 * @param dataExchange 
		 * @returns {Promise<PlatformData>}
		 */
		setup: async (componentID:number, dataExchange:DataExchange): Promise<PlatformData> => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/setup/' + componentID, dataExchange);
		},
		/**
		 * Sends a cancel command to a given component (device).
		 * @param {number} componentID - The ID of the desired device 
		 * @returns {Promise<PlatformData>}
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
		 * @param {number} componentID - The ID of the desired device
		 * @returns {Promise<PlatformData>}
		 */
		enable: async (componentID:number): Promise<PlatformData> => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/userpresent/enable/' + componentID);
		},
		/**
		 * Sends disable command to a given component (device).
		 * @param {number} componentID - The ID of the desired device
		 * @returns {Promise<PlatformData>}
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
		 * @param {AppState} state - The state to change to.
		 * @param {ChangeReason} reasonCode - The enumerated reasonCode for the state change.
		 * @param {string} reason - The reason for the state change.
		 * @returns {Promise<PlatformData|undefined>} Response from the platform.
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
		announcement: {
			play: async (componentID:number, rawData:string): Promise<PlatformData> => {
				validateComponentId(componentID);
				const dataExchange = {
					toPlatform: {
						dataRecords: [ { data: rawData as any, dsTypes: [ CUSSDataTypes.SSML10 ] } ]
					},
				} as DataExchange;
				return await this.connection.post('/peripherals/announcement/play/' + componentID, dataExchange);
			},
			pause: async (componentID:number): Promise<PlatformData> => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/pause/' + componentID);
			},

			resume: async (componentID:number): Promise<PlatformData> => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/resume/' + componentID);
			},

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
	 * @returns {Promise<PlatformData|undefined>} Response from the platform.
	 */
	async requestAvailableState(): Promise<PlatformData|undefined> {
		// allow hoping directly to AVAILABLE from INITIALIZE
		if (this.state === AppState.INITIALIZE) {
			await this.requestUnavailableState();
		}
		const okToChange = this.state === AppState.UNAVAILABLE || this.state === AppState.ACTIVE;
		return okToChange ? this.api.staterequest(AppState.AVAILABLE) : Promise.resolve(undefined);
	}
	/**
	 * Request the platform to change the application state to Unavailable state.
	 * @returns {Promise<PlatformData|undefined>} Response from the platform.
	 */
	requestUnavailableState(): Promise<PlatformData|undefined> {
		const okToChange = this.state === AppState.INITIALIZE || this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
		return okToChange ? this.api.staterequest(AppState.UNAVAILABLE) : Promise.resolve(undefined);
	}
	/**
	 * Request the platform to change the application state to Stopped state.
	 * @returns {Promise<PlatformData|undefined>} Response from the platform.
	 */
	requestStoppedState(): Promise<PlatformData|undefined> {
		return this.api.staterequest(AppState.STOPPED);
	}
	/**
	 * Request the platform to change the application state to Active state.
	 * @returns {Promise<PlatformData|undefined>} Response from the platform.
	 */
	requestActiveState(): Promise<PlatformData|undefined> {
		const okToChange = this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
		return okToChange ? this.api.staterequest(AppState.ACTIVE) : Promise.resolve(undefined);
	}
	/**
	 * Request the platform to reload the application.
	 * @returns {Promise<boolean>} Response from the platform whether it can reload or not.
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
	 * @returns {Promise<boolean>} Response from the platform, whether the query was able to be sent or not.
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
	 * @returns {Component[]} List of unavailable components.
	 */
	get unavailableComponents(): Component[] {
		const components = Object.values(this.components) as Component[];
		return components.filter((c:Component) => !c.ready);
	}
	/**
	 * @returns {Component[]} List of unavailable components that have been marked required.
	 */
	get unavailableRequiredComponents(): Component[] {
		return this.unavailableComponents.filter((c:Component) => c.required)
	}

	/**
	 * Check if all required components are available and move application to the appropriate state based on their status.
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
