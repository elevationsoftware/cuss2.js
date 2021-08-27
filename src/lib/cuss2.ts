import { logger } from "./helper";
import {EnvironmentLevel} from "./interfaces/environmentLevel";
import {PlatformData} from "./interfaces/platformData";
import {BehaviorSubject, Subject} from "rxjs";
import {ApplicationStates} from "./interfaces/applicationStates";
import ApplicationStateCodeEnum = ApplicationStates.ApplicationStateCodeEnum;
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
import { ElevatedMetric } from './interfaces/elevatedMetrics';

function validateComponentId(componentID:any) {
	if (typeof componentID !== 'number') {
		throw new TypeError('Invalid componentID: ' + componentID);
	}
}

export class Cuss2 {

	static async connect(url: string, client_id: string, client_secret: string, options: any = {}): Promise<Cuss2> {
		const connection = await Connection.connect(url, client_id, client_secret,  options.tokenURL);
		const cuss2 = new Cuss2(connection);
		await cuss2.api.getEnvironment();
		await cuss2.api.getComponents();
		return cuss2;
	}
	static logger = logger;

	public metric: BehaviorSubject<ElevatedMetric>;

	private constructor(connection: Connection) {
		this.connection = connection;
		connection.messages.subscribe(async e => await this._handleWebSocketMessage(e))
		this.metric = new BehaviorSubject<ElevatedMetric>(ElevatedMetric.NONE);
	}
	connection:Connection;
	environment: EnvironmentLevel = {} as EnvironmentLevel;
	components: any|undefined = undefined;
	stateChange: BehaviorSubject<ApplicationStateCodeEnum> = new BehaviorSubject<ApplicationStateCodeEnum>(ApplicationStateCodeEnum.STOPPED);
	onmessage: Subject<any> = new Subject<any>();

	bagTagPrinter?: BagTagPrinter;
	boardingPassPrinter?: BoardingPassPrinter;
	documentReader?: DocumentReader;
	barcodeReader?: BarcodeReader;
	announcement?: Announcement;
	keypad?: Keypad;
	msrPayment?: PaymentDevice;
	_activated?: Function;

	get state() {
		return this.stateChange.getValue();
	}

	async _handleWebSocketMessage(data: DataExchange) {
		const message = data && data.toApplication;
		if (!message || message.statusCode === undefined) return; // initial value is an empty value

		logger('[event.currentApplicationState]', message.currentApplicationState);

		const currentApplicationState = message.currentApplicationState.toString();
		if(currentApplicationState !== this.stateChange.getValue()) {
			this.stateChange.next(currentApplicationState as ApplicationStateCodeEnum);

			if (this._online && currentApplicationState === ApplicationStateCodeEnum.INITIALIZE) {
				this.checkRequiredComponentsAndSyncState();
			}
			else if (this._activated && currentApplicationState === ApplicationStateCodeEnum.ACTIVE) {
				this._handleActivate();
			}
		}

		if(message.componentID && this.components) {
			const component = this.components[message.componentID];
			if (component && (component.statusCode !== message.statusCode || component.eventHandlingCode !== message.eventHandlingCode)) {
				component.statusCode = message.statusCode;
				component.eventHandlingCode = message.eventHandlingCode;
				this.checkRequiredComponentsAndSyncState();
			}
		}

		logger("[socket.onmessage]", message);

		this.onmessage.next(message)
	}

	get api() {
		const self = this;
		return {
			//
			// "GET" calls
			//
			getEnvironment: async (): Promise<EnvironmentLevel> => {
				const response = await self.connection.get('/platform/environment');
				logger('[getEnvironment()] response', response);
				self.environment = response.environmentLevel as EnvironmentLevel;
				return self.environment;
			},
			getComponents: async (): Promise<Component[]> => {
				const response = await self.connection.get('/platform/components');
				logger('[getComponents()] response', response);
				const componentList = response.componentList as ComponentList;
				const components:any = {};

				componentList.forEach((component) => {
					const id = String(component.componentID);
					const type = component.componentType;
					const charac0 = component.componentCharacteristics?.[0];
					const mediaTypes = charac0?.mediaTypesList;

					const dsTypesHas = (type: CUSSDataTypes) => charac0?.dsTypesList?.find((d) => d === type);
					const mediaTypesHas = (type: MediaTypes) => mediaTypes?.find((m) => m === type);

					let instance;

					const isAnnouncement = () => !self.announcement && type === ComponentTypes.ANNOUNCEMENT;
					const isFeeder = () => type === ComponentTypes.FEEDER;
					const isDispenser = () => type === ComponentTypes.DISPENSER;
					const isBagTagPrinter = () => !self.bagTagPrinter && mediaTypesHas(MediaTypes.BAGGAGETAG);
					const isBoardingPassPrinter = () => !self.boardingPassPrinter && mediaTypesHas(MediaTypes.BOARDINGPASS);
					const isDocumentReader = () => !self.documentReader &&
						charac0?.readerType === ReaderTypes.FLATBEDSCAN && dsTypesHas(CUSSDataTypes.CODELINE);
					const isBarcodeReader = () => !self.barcodeReader && dsTypesHas(CUSSDataTypes.BARCODE);
					const isMsrPayment = () => charac0?.readerType === ReaderTypes.DIP && mediaTypesHas(MediaTypes.MAGNETICSTRIPE);
					const isKeypad = () => dsTypesHas(CUSSDataTypes.KEY) && dsTypesHas(CUSSDataTypes.KEYUP) && dsTypesHas(CUSSDataTypes.KEYDOWN);

					if (isAnnouncement()) instance = self.announcement = new Announcement(component, self);
					else if (isFeeder()) instance = new Feeder(component, self);
					else if (isDispenser()) instance = new Dispenser(component, self);
					else if (isBagTagPrinter()) instance = self.bagTagPrinter = new BagTagPrinter(component, self);
					else if (isBoardingPassPrinter()) instance = self.boardingPassPrinter = new BoardingPassPrinter(component, self);
					else if (isDocumentReader()) instance = self.documentReader = new DocumentReader(component, self);
					else if (isBarcodeReader()) instance = self.barcodeReader = new BarcodeReader(component, self);
					else if (isMsrPayment()) instance = self.msrPayment = new PaymentDevice(component, self);
					else if (isKeypad()) instance = self.keypad = new Keypad(component, self);

					return components[id] = instance || new Component(component, self);
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
				assignLinks(self.boardingPassPrinter as BoardingPassPrinter);
				assignLinks(self.bagTagPrinter as BagTagPrinter);

				await Promise.all(
					componentList.map(c => self.api.getStatus(c.componentID as number)
						.catch(e => e)) //it rejects statusCodes that are not "OK" - but here we just need to know what it is, so ignore
				)
					.then(responses => {
						responses.forEach(response => {
							const id = String(response.componentID);
							components[id].eventHandlingCode = response.eventHandlingCode
							components[id].status = response.statusCode
						})
					});

				self.components = components;
				return components;
			},
			getStatus: async (componentID:number): Promise<PlatformData> => {
				const response = await this.connection.get('/peripherals/query/' + componentID);
				logger('[queryDevice()] response', response.data);
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

			staterequest: async (state: ApplicationStateCodeEnum): Promise<boolean> => {
				const response = await self.connection.post('/platform/applications/staterequest/' + state, {});
				if (response.statusCode !== 'OK') {
					throw new Error(`Request to enter ${state} state failed: ${response.statusCode}`);
				}
				this._appStateHandler(state);
				return true;
			},

			/*
			*		/peripherals/announcement/XXXXX
			*/
			get announcement() {
				return {
					play: async (componentID:number, rawData:string) => {
						validateComponentId(componentID);
						const dataExchange = {
							toPlatform: {
								dataRecords: [{dataStatus: 'DS_OK', data: rawData}]
							}
						};
						return await self.connection.post('/peripherals/announcement/play/' + componentID, dataExchange);
					},
					pause: async (componentID:number) => {
						validateComponentId(componentID);
						return await self.connection.post('/peripherals/announcement/pause/' + componentID);
					},

					resume: async (componentID:number) => {
						validateComponentId(componentID);
						return await self.connection.post('/peripherals/announcement/resume/' + componentID);
					},

					stop: async (componentID:number) => {
						validateComponentId(componentID);
						return await self.connection.post('/peripherals/announcement/stop/' + componentID);
					}
				}
			}

		};
	}

	/**
	 * Handles the application state for metrics change behavior subjects.
	 * @private
	 */
	_appStateHandler(state: ApplicationStateCodeEnum) {
		switch(state) {
			case ApplicationStateCodeEnum.INITIALIZE:
				this.metric.next(ElevatedMetric.APP_INITIALIZE);
				break;
			case ApplicationStateCodeEnum.ACTIVE:
				this.metric.next(ElevatedMetric.APP_ACTIVE);
				break;
			case ApplicationStateCodeEnum.AVAILABLE:
				this.metric.next(ElevatedMetric.APP_AVAILABLE);
				break;
			case ApplicationStateCodeEnum.UNAVAILABLE:
				this.metric.next(ElevatedMetric.APP_UNAVAILABLE);
				break;
		}
	}

	/**
	 * Handles the component failure state for metrics change behavior subjects.
	 * @private
	 */
	_componentFailureStateMetricHandler(c: Component) {
		if (c instanceof BagTagPrinter) {
			this.metric.next(ElevatedMetric.BAGTAG_ERROR);
		}
		if (c instanceof BoardingPassPrinter) {
			this.metric.next(ElevatedMetric.BOARDINGPASS_ERROR);
		}
	}

	//
	// State requests. Only offer the ones that are valid to request.
	//
	async requestAvailableState(): Promise<boolean> {
		// allow hoping directly to AVAILABLE from INITIALIZE
		if (this.state === ApplicationStateCodeEnum.INITIALIZE) {
			this.metric.next(ElevatedMetric.APP_INITIALIZE);
			await this.requestUnavailableState();
		}
		const okToChange = this.state === ApplicationStateCodeEnum.UNAVAILABLE;
		return okToChange ? this.api.staterequest(ApplicationStateCodeEnum.AVAILABLE) : Promise.resolve(false);
	}
	requestUnavailableState(): Promise<boolean> {
		const okToChange = this.state === ApplicationStateCodeEnum.INITIALIZE || this.state === ApplicationStateCodeEnum.AVAILABLE || this.state === ApplicationStateCodeEnum.ACTIVE;
		return okToChange ? this.api.staterequest(ApplicationStateCodeEnum.UNAVAILABLE) : Promise.resolve(false);
	}
	requestStoppedState(): Promise<boolean> {
		return this.api.staterequest(ApplicationStateCodeEnum.STOPPED);
	}
	requestActiveState(): Promise<boolean> {
		const okToChange = this.state === ApplicationStateCodeEnum.AVAILABLE || this.state === ApplicationStateCodeEnum.ACTIVE;
		return okToChange ? this.api.staterequest(ApplicationStateCodeEnum.ACTIVE) : Promise.resolve(false);
	}
	requestReload(): Promise<boolean> {
		const okToChange = this.state === ApplicationStateCodeEnum.UNAVAILABLE || this.state === ApplicationStateCodeEnum.AVAILABLE || this.state === ApplicationStateCodeEnum.ACTIVE;
		return okToChange ? this.api.staterequest(ApplicationStateCodeEnum.RELOAD) : Promise.resolve(false);
	}

	get unavailableComponents(): Component[] {
		const components = Object.values(this.components) as Component[];
		return components.filter((c:Component) => {
			 this._componentFailureStateMetricHandler(c);
			 return c.eventHandlingCode === EventHandlingCodes.UNAVAILABLE;
		});
	}
	get unavailableRequiredComponents(): Component[] {
		return this.unavailableComponents.filter((c:Component) => c.required)
	}

	checkRequiredComponentsAndSyncState(): void {
		if (this._online) {
			const inactiveRequiredComponents = this.unavailableRequiredComponents;
			if (!inactiveRequiredComponents.length) {
				logger('[checkRequiredComponentsAndSyncState] All required components OK ✅. Ready for AVAILABLE state.');
				this.requestAvailableState();
			}
			else {
				logger('[checkRequiredComponentsAndSyncState] Required components inactive:', inactiveRequiredComponents.map((c: Component) => c.constructor.name));
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
			logger('An error happened when calling activated', e)
		})
	}

	set activated(fn:Function) {
		this._activated = fn;
		if (this.state === ApplicationStateCodeEnum.ACTIVE) {
			this._handleActivate();
		}
	}
}

export * from "./models/component";
