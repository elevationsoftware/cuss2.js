import { logger, logConfig } from "./helper";
import {EnvironmentLevel} from "./interfaces/environmentLevel";
import {PlatformData} from "./interfaces/platformData";
import {BehaviorSubject, Subject} from "rxjs";
import {ApplicationStates} from "./interfaces/applicationStates";
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
	Printer
} from "./models/component";
import {DataTypes} from "./interfaces/dataTypes";
import {ReaderTypes} from "./interfaces/readerTypes";
import {MediaTypes} from "./interfaces/mediaTypes";

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
	static logConfig = logConfig;

	private constructor(connection: Connection) {
		this.connection = connection;
		connection.messages.subscribe(e => this._handleWebSocketMessage(e))
	}
	connection:Connection;
	environment: EnvironmentLevel = {};
	components: any = {};
	stateChange: BehaviorSubject<ApplicationStates> = new BehaviorSubject<ApplicationStates>(ApplicationStates.STOPPED);
	onmessage: Subject<any> = new Subject<any>();

	bagTagPrinter?: Printer;
	boardingPassPrinter?: Printer;
	documentReader?: DocumentReader;
	barcodeReader?: BarcodeReader;
	announcement?: Announcement;
	keypad?: Keypad;
	msrPayment?: PaymentDevice;

	get state() {
		return this.stateChange.getValue();
	}

	_handleWebSocketMessage(message: any) {
		message = message && message.toApplication;
		if (!message || message.statusCode === undefined) return; // initial value is an empty value

		logger('[event.currentApplicationState]', message.currentApplicationState);

		if(message.currentApplicationState !== this.stateChange.getValue()) {
			this.stateChange.next(message.currentApplicationState);
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
				const components = response.componentList as ComponentList;

				self.components = {};
				components.forEach((component) => {
					const id = String(component.componentID);
					const type = component.componentType;
					const charac0 = component.componentCharacteristics?.[0];
					const mediaTypes = charac0?.mediaTypesList;

					const dsTypesHas = (type: DataTypes) => charac0?.dsTypesList?.find((d) => d === type);
					const mediaTypesHas = (type: MediaTypes) => mediaTypes?.find((m) => m === type);

					let instance;

					const isAnnouncement = () => !self.announcement && type === ComponentTypes.ANNOUNCEMENT;
					const isFeeder = () => type === ComponentTypes.FEEDER;
					const isDispenser = () => type === ComponentTypes.DISPENSER;
					const isBagTagPrinter = () => !self.bagTagPrinter && mediaTypesHas(MediaTypes.BaggageTag);
					const isBoardingPassPrinter = () => !self.boardingPassPrinter && mediaTypesHas(MediaTypes.BoardingPass);
					const isDocumentReader = () => !self.documentReader &&
						charac0?.readerType === ReaderTypes.FlatbedScan && dsTypesHas(DataTypes.CODELINE);
					const isBarcodeReader = () => !self.barcodeReader && dsTypesHas(DataTypes.BARCODE);
					const isMsrPayment = () => charac0?.readerType === ReaderTypes.DIP && mediaTypesHas(MediaTypes.MagneticStripe);
					const isKeypad = () => dsTypesHas(DataTypes.KEY) && dsTypesHas(DataTypes.KEYUP) && dsTypesHas(DataTypes.KEYDOWN);

					if (isAnnouncement()) instance = self.announcement = new Announcement(component, self);
					else if (isFeeder()) instance = new Feeder(component, self);
					else if (isDispenser()) instance = new Dispenser(component, self);
					else if (isBagTagPrinter()) instance = self.bagTagPrinter = new Printer(component, self);
					else if (isBoardingPassPrinter()) instance = self.boardingPassPrinter = new Printer(component, self);
					else if (isDocumentReader()) instance = self.documentReader = new DocumentReader(component, self);
					else if (isBarcodeReader()) instance = self.barcodeReader = new BarcodeReader(component, self);
					else if (isMsrPayment()) instance = self.msrPayment = new PaymentDevice(component, self);
					else if (isKeypad()) instance = self.keypad = new Keypad(component, self);

					return self.components[id] = instance || new Component(component, self);
				});

				function assignLinks(printer: Printer) {
					if (!printer) return;

					const links = printer._component.linkedComponentIDs;

					if (printer && links?.length) {
						links.forEach((id) => {
							const component = self.components[id] as Component;
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
				assignLinks(self.boardingPassPrinter as Printer);
				assignLinks(self.bagTagPrinter as Printer);
				return self.components;
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

			staterequest: async (state: ApplicationStates): Promise<boolean> => {
				const response = await self.connection.post('/platform/applications/staterequest/' + state, {});
				if (response.statusCode !== 'OK') {
					throw new Error(`Request to enter ${state} state failed: ${response.statusCode}`);
				}
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

	//
	// State requests. Only offer the ones that are valid to request.
	//
	async requestAvailableState(): Promise<boolean> {
		if (this.state === 'INITIALIZE') {
			await this.requestUnavailableState();
		}
		return this.api.staterequest(ApplicationStates.AVAILABLE);
	}
	requestUnavailableState(): Promise<boolean> {
		return this.api.staterequest(ApplicationStates.UNAVAILABLE);
	}
	requestStoppedState(): Promise<boolean> {
		return this.api.staterequest(ApplicationStates.STOPPED);
	}
	requestActiveState(): Promise<boolean> {
		return this.api.staterequest(ApplicationStates.ACTIVE);
	}
	requestReload(): Promise<boolean> {
		return this.api.staterequest(ApplicationStates.RELOAD);
	}
}
