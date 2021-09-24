import { log, logger, helpers, LogMessage } from "./helper";
import {EnvironmentLevel} from "./interfaces/environmentLevel";
import {PlatformData} from "./interfaces/platformData";
import {BehaviorSubject, Subject} from "rxjs";
import {ApplicationStates} from "./interfaces/applicationStates";
import AppState = ApplicationStates.ApplicationStateCodeEnum;
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
	PaymentDevice,
	Printer,
	BagTagPrinter,
	BoardingPassPrinter
} from "./models/component";
import { CUSSDataTypes } from "./interfaces/cUSSDataTypes";
import {ReaderTypes} from "./interfaces/readerTypes";
import {MediaTypes} from "./interfaces/mediaTypes";
import {EventHandlingCodes} from "./interfaces/eventHandlingCodes";

function validateComponentId(componentID:any) {
	if (typeof componentID !== 'number') {
		throw new TypeError('Invalid componentID: ' + componentID);
	}
}

export class Cuss2 {

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
		connection.messages.subscribe(async e => await this._handleWebSocketMessage(e))
		connection.onclose.subscribe(async () => {
			await connection._connect();
			await this._initialize();
		});
	}
	connection:Connection;
	environment: EnvironmentLevel = {} as EnvironmentLevel;
	components: any|undefined = undefined;
	stateChange: BehaviorSubject<AppState> = new BehaviorSubject<AppState>(AppState.STOPPED);
	componentStateChange: BehaviorSubject<Component|null> = new BehaviorSubject<Component|null>(null);
	onmessage: Subject<any> = new Subject<any>();

	bagTagPrinter?: BagTagPrinter;
	boardingPassPrinter?: BoardingPassPrinter;
	documentReader?: DocumentReader;
	barcodeReader?: BarcodeReader;
	announcement?: Announcement;
	keypad?: Keypad;
	msrPayment?: PaymentDevice;
	_activated?: Function;
	pendingStateChange?: AppState;

	get state() {
		return this.stateChange.getValue();
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
		// ensure state is INITIALIZE
		if ([AppState.STOPPED, AppState.UNAVAILABLE, AppState.AVAILABLE, AppState.ACTIVE].includes(this.state)) {
			log("info", "Platform not in INITIALIZE state");
			await this.api.staterequest(AppState.RELOAD);
			log("info", "Getting Environment Information");
			await this.api.getEnvironment();
		}
		if (this.state !== AppState.INITIALIZE) {
			throw new Error('Platform in abnormal state. HALTING.');
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
			log('verbose', `[state changed] old:${this.state} new:${currentState}`);
			this.stateChange.next(currentState as AppState);

			if (this._online && currentState === AppState.UNAVAILABLE) {
				await this.queryComponents().catch(e => log('verbose', 'failed to queryComponents', e));
				this.checkRequiredComponentsAndSyncState();
			}
			else if (this._activated && currentState === AppState.ACTIVE) {
				this._handleActivate();
			}
		}

		if(message.componentID && this.components) {
			const component = this.components[message.componentID];
			if (component && component.stateChanged(message)) {
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
		getEnvironment: async (): Promise<EnvironmentLevel> => {
			const response = await this.connection.get('/platform/environment');
			log('verbose', '[getEnvironment()] response', response);
			this.environment = response.environmentLevel as EnvironmentLevel;
			return this.environment;
		},
		getComponents: async (): Promise<ComponentList> => {
			const response = await this.connection.get('/platform/components');
			log('verbose', '[getComponents()] response', response);
			const componentList = response.componentList as ComponentList;
			if (this.components) return componentList;

			const components:any = this.components = {};

			componentList.forEach((component) => {
				const id = String(component.componentID);
				const type = component.componentType;
				const charac0 = component.componentCharacteristics?.[0];
				const mediaTypes = charac0?.mediaTypesList;

				const dsTypesHas = (type: CUSSDataTypes) => charac0?.dsTypesList?.find((d) => d === type);
				const mediaTypesHas = (type: MediaTypes) => mediaTypes?.find((m) => m === type);

				let instance;

				const isAnnouncement = () => type === ComponentTypes.ANNOUNCEMENT;
				const isFeeder = () => type === ComponentTypes.FEEDER;
				const isDispenser = () => type === ComponentTypes.DISPENSER;
				const isBagTagPrinter = () => mediaTypesHas(MediaTypes.BAGGAGETAG);
				const isBoardingPassPrinter = () => mediaTypesHas(MediaTypes.BOARDINGPASS);
				const isDocumentReader = () => charac0?.readerType === ReaderTypes.FLATBEDSCAN && dsTypesHas(CUSSDataTypes.CODELINE);
				const isBarcodeReader = () => dsTypesHas(CUSSDataTypes.BARCODE);
				const isMsrPayment = () => charac0?.readerType === ReaderTypes.DIP && mediaTypesHas(MediaTypes.MAGNETICSTRIPE);
				const isKeypad = () => dsTypesHas(CUSSDataTypes.KEY) && dsTypesHas(CUSSDataTypes.KEYUP) && dsTypesHas(CUSSDataTypes.KEYDOWN);

				if (isAnnouncement()) instance = this.announcement = new Announcement(component, this);
				else if (isFeeder()) instance = new Feeder(component, this);
				else if (isDispenser()) instance = new Dispenser(component, this);
				else if (isBagTagPrinter()) instance = this.bagTagPrinter = new BagTagPrinter(component, this);
				else if (isBoardingPassPrinter()) instance = this.boardingPassPrinter = new BoardingPassPrinter(component, this);
				else if (isDocumentReader()) instance = this.documentReader = new DocumentReader(component, this);
				else if (isBarcodeReader()) instance = this.barcodeReader = new BarcodeReader(component, this);
				else if (isMsrPayment()) instance = this.msrPayment = new PaymentDevice(component, this);
				else if (isKeypad()) instance = this.keypad = new Keypad(component, this);
				else instance = new Component(component, this);

				return components[id] = instance;
			});

			function assignLinks(printer: Printer) {
				if (!printer) return;

				const links = printer._component.linkedComponentIDs;

				if (printer && links?.length) {
					links.forEach((id) => {
						const component = components[id] as Component;
						const type = component._component.componentType;
						if (type === ComponentTypes.FEEDER) {
							const feeder = component as Feeder;
							feeder.printer = printer;
							printer.feeder = component;
							return;
						}
						if (type === ComponentTypes.DISPENSER) {
							const dispenser = component as Dispenser;
							dispenser.printer = printer;
							printer.dispenser = component;
							return;
						}
						console.error('unknown linked component: ' + id)
					});
				}
			}
			assignLinks(this.boardingPassPrinter as BoardingPassPrinter);
			assignLinks(this.bagTagPrinter as BagTagPrinter);

			return componentList;
		},
		getStatus: async (componentID:number): Promise<PlatformData> => {
			const response = await this.connection.get('/peripherals/query/' + componentID);
			log('verbose', '[queryDevice()] response', response);
			return response as PlatformData;
		},

		send: async (componentID:number, dataExchange:DataExchange) => {
			return this.connection.post('/peripherals/send/' + componentID, dataExchange);
		},
		setup: async (componentID:number, dataExchange:DataExchange) => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/setup/' + componentID, dataExchange);
		},
		cancel: async (componentID:number) => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/cancel/' + componentID);
		},

		/*
		*		/peripherals/userpresent/XXXXX
		*/
		enable: async (componentID:number) => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/userpresent/enable/' + componentID);
		},
		disable: async (componentID:number) => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/userpresent/disable/' + componentID);
		},
		offer: async (componentID:number) => {
			validateComponentId(componentID);
			return await this.connection.post('/peripherals/userpresent/offer/' + componentID);
		},

		staterequest: async (state: AppState): Promise<PlatformData|undefined> => {
			if (this.pendingStateChange) {
				return Promise.resolve(undefined);
			}
			log("info", `Requesting ${state} state`);
			this.pendingStateChange = state;
			let response:PlatformData|undefined;
			try {
				response = await this.connection.post('/platform/applications/staterequest/' + state, {})
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
			play: async (componentID:number, rawData:string) => {
				validateComponentId(componentID);
				const dataExchange = {
					toPlatform: {
						dataRecords: [ { data: rawData as any, dsTypes: [ CUSSDataTypes.SSML10 ] } ]
					},
				} as DataExchange;
				return await this.connection.post('/peripherals/announcement/play/' + componentID, dataExchange);
			},
			pause: async (componentID:number) => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/pause/' + componentID);
			},

			resume: async (componentID:number) => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/resume/' + componentID);
			},

			stop: async (componentID:number) => {
				validateComponentId(componentID);
				return await this.connection.post('/peripherals/announcement/stop/' + componentID);
			}
		}
	};

	//
	// State requests. Only offer the ones that are valid to request.
	//
	async requestAvailableState(): Promise<PlatformData|undefined> {
		// allow hoping directly to AVAILABLE from INITIALIZE
		if (this.state === AppState.INITIALIZE) {
			await this.requestUnavailableState();
		}
		const okToChange = this.state === AppState.UNAVAILABLE || this.state === AppState.ACTIVE;
		return okToChange ? this.api.staterequest(AppState.AVAILABLE) : Promise.resolve(undefined);
	}
	requestUnavailableState(): Promise<PlatformData|undefined> {
		const okToChange = this.state === AppState.INITIALIZE || this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
		return okToChange ? this.api.staterequest(AppState.UNAVAILABLE) : Promise.resolve(undefined);
	}
	requestStoppedState(): Promise<PlatformData|undefined> {
		return this.api.staterequest(AppState.STOPPED);
	}
	requestActiveState(): Promise<PlatformData|undefined> {
		const okToChange = this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
		return okToChange ? this.api.staterequest(AppState.ACTIVE) : Promise.resolve(undefined);
	}
	async requestReload(): Promise<boolean> {
		const okToChange = !this.state || this.state === AppState.UNAVAILABLE || this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
		if (!okToChange) {
			return Promise.resolve(false);
		}

		await this.api.staterequest(AppState.RELOAD);
		this.connection._socket?.close();
		return true;
	}

	async queryComponents(): Promise<boolean> {
		if (!this.components) {
			return false;
		}
		const componentList = Object.values(this.components) as Component[];
		await Promise.all(
			componentList.map(c => c.query()
				.catch(e => e)) //it rejects statusCodes that are not "OK" - but here we just need to know what it is, so ignore
			)
			.then(responses => {
				responses.forEach(response => {
					const id = String(response.componentID);
					this.components[id].eventHandlingCode = response.eventHandlingCode;
					this.components[id].status = response.statusCode;
				})
			});
		return true;
	}

	get unavailableComponents(): Component[] {
		const components = Object.values(this.components) as Component[];
		return components.filter((c:Component) => c.eventHandlingCode === EventHandlingCodes.UNAVAILABLE);
	}
	get unavailableRequiredComponents(): Component[] {
		return this.unavailableComponents.filter((c:Component) => c.required)
	}

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
				log('verbose', '[checkRequiredComponentsAndSyncState] Required components inactive:', inactiveRequiredComponents.map((c: Component) => c.constructor.name));
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

	_handleActivate(): void {
		if (!this._activated) return;
		this._activated().catch((e: Error) => {
			log('verbose', 'An error happened when calling activated', e)
		})
	}

	set activated(fn:Function) {
		this._activated = fn;
		if (this.state === AppState.ACTIVE) {
			this._handleActivate();
		}
	}
}

export * from "./models/component";
export * from "./helper";
