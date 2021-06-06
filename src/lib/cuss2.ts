import { logger } from "./helper";
import {EnvironmentLevel} from "./interfaces/environmentLevel";
import {PlatformData} from "./interfaces/platformData";
import {BehaviorSubject} from "rxjs";
import {ApplicationStates} from "./interfaces/applicationStates";
import {ApplicationActivation} from "./interfaces/applicationActivation";
import {ComponentList} from "./interfaces/componentList";

import {Connection} from "./connection";

const ExecutionModeEnum = ApplicationActivation.ExecutionModeEnum;


export class Cuss2 {

	static async connect(url: string, client_id: string, client_secret: string, options: any = {}): Promise<Cuss2> {
		const connection = await Connection.connect(url, client_id, client_secret,  options.tokenURL);
		const cuss2 = new Cuss2(connection);
		await cuss2.getEnvironment();
		return cuss2;
	}

	private constructor(connection: Connection) {
		this.connection = connection;
		connection.messages.subscribe(e => this._handleWebSocketMessage(e))
	}
	auth: any;
	connection:Connection;
	environment: EnvironmentLevel = {};
	stateChange: BehaviorSubject<ApplicationStates> = new BehaviorSubject<ApplicationStates>(ApplicationStates.STOPPED);
	get state() {
		return this.stateChange.getValue();
	}

	applicationBrand: string = '';
	executionMode: ApplicationActivation.ExecutionModeEnum = ExecutionModeEnum.MAM;
	accessibleMode: boolean = false;
	executionOptions: string = '';
	languageID: string = 'en-US';
	transferData: string = '';

	_handleWebSocketMessage(message: any) {
		message = message && message.toApplication;
		if (!message || message.statusCode === undefined) return; // initial value is an empty value

		logger('[event.currentApplicationState]', message.currentApplicationState);

		if(message.currentApplicationState !== this.stateChange.getValue()) {
			this.stateChange.next(message.currentApplicationState);
		}

		logger("[socket.onmessage]", message);
		//TODO: handle unsolicited messages
	}

	//
	// API "GET" calls
	//
	async getEnvironment(): Promise<EnvironmentLevel> {
		const response = await this.connection.get('/platform/environment');
		logger('[getEnvironment()] response', response);
		this.environment = response.environmentLevel as EnvironmentLevel;
		return this.environment;
	}

	async getComponents(): Promise<ComponentList> {
		const response = await this.connection.get('/platform/components');
		logger('[getComponents()] response', response);
		return response.componentList as ComponentList;
	}

	async getStatus(componentID:number): Promise<PlatformData> {
		const response = await this.connection.get('/peripherals/query/' + componentID);
		logger('[queryDevice()] response', response.data);
		return response as PlatformData;
	}

	//
	// State requests. Only offer the ones that are valid to request.
	//
	async requestAvailableState(): Promise<boolean> {
		if (this.state === 'INITIALIZE') {
			await this.requestUnavailableState();
		}
		return this._moveToState(ApplicationStates.AVAILABLE);
	}
	requestUnavailableState(): Promise<boolean> {
		return this._moveToState(ApplicationStates.UNAVAILABLE);
	}
	requestStoppedState(): Promise<boolean> {
		return this._moveToState(ApplicationStates.STOPPED);
	}
	requestActiveState(): Promise<boolean> {
		return this._moveToState(ApplicationStates.ACTIVE);
	}
	requestReload(): Promise<boolean> {
		return this._moveToState(ApplicationStates.RELOAD);
	}
	async _moveToState (state: ApplicationStates): Promise<boolean> {
		const response = await this.connection.post('/platform/applications/staterequest/' + state, {});
		if (response.eventCode !== 'EC_OK') {
			throw new Error(`Request to enter ${state} state failed: ${response.eventCode}`);
		}
		return true;
	}

	//
	// Syntactic sugar for /peripherals/send/{componentID} calls
	//
	async _send(componentID:number, dataExchange:any) {
		return this.connection.post('/peripherals/send/' + componentID, dataExchange);
	}
	async print(rawData:string, componentID?:number) {
		if (componentID === undefined) {
			const components = await this.getComponents();
			const printer = components.find(component => component.componentType === 'MEDIA_OUTPUT');
			if (printer === undefined) {
				throw new Error('MEDIA_OUTPUT component not found');
			}
			componentID = printer.componentID;
		}
		if (typeof componentID !== 'number') {
			throw new TypeError('Invalid componentID: ' + componentID);
		}
		const dataRecords = {
			requestID: '',	// TBD: Remove this when the mock server is fixed
			toPlatform: {
				dataRecords: [{dataStatus: 'DS_OK', data: rawData}]
			}
		};
		// logConfig.enable = true
		const response = await this._send(componentID as number, dataRecords);
		// logConfig.enable = false
		return response
	}

	async setup(rawData:string, componentID:number) {
		if (typeof componentID !== 'number') {
			throw new TypeError('Invalid componentID: ' + componentID);
		}
		const dataExchange = {
			toPlatform: {
				dataRecords: [{dataStatus: 'DS_OK', data: rawData}]
			}
		};
		return await this.connection.post('/peripherals/setup/' + componentID, dataExchange);
	}

	async cancel(componentID:number) {
		if (typeof componentID !== 'number') {
			throw new TypeError('Invalid componentID: ' + componentID);
		}
		return await this.connection.post('/peripherals/cancel/' + componentID);
	}

	/*
	*		/peripherals/userpresent/XXXXX
	*/
	async enable(componentID:number) {
		if (typeof componentID !== 'number') {
			throw new TypeError('Invalid componentID: ' + componentID);
		}
		return await this.connection.post('/peripherals/userpresent/enable/' + componentID);
	}

	async disable(componentID:number) {
		if (typeof componentID !== 'number') {
			throw new TypeError('Invalid componentID: ' + componentID);
		}
		return await this.connection.post('/peripherals/userpresent/disable/' + componentID);
	}

	async offer(componentID:number) {
		if (typeof componentID !== 'number') {
			throw new TypeError('Invalid componentID: ' + componentID);
		}
		return await this.connection.post('/peripherals/userpresent/offer/' + componentID);
	}

	/*
	*		/peripherals/announcement/XXXXX
	*/
	get announcement() {
		return {
			play: async (rawData:string, componentID:number) => {
				if (typeof componentID !== 'number') {
					throw new TypeError('Invalid componentID: ' + componentID);
				}
				const dataExchange = {
					toPlatform: {
						dataRecords: [{dataStatus: 'DS_OK', data: rawData}]
					}
				};
				return await this.connection.post('/peripherals/announcement/play/' + componentID, dataExchange);
			},
			pause: async (componentID:number) => {
				if (typeof componentID !== 'number') {
					throw new TypeError('Invalid componentID: ' + componentID);
				}
				return await this.connection.post('/peripherals/announcement/pause/' + componentID);
			},

			resume: async (componentID:number) => {
				if (typeof componentID !== 'number') {
					throw new TypeError('Invalid componentID: ' + componentID);
				}
				return await this.connection.post('/peripherals/announcement/resume/' + componentID);
			},

			stop: async (componentID:number) => {
				if (typeof componentID !== 'number') {
					throw new TypeError('Invalid componentID: ' + componentID);
				}
				return await this.connection.post('/peripherals/announcement/stop/' + componentID);
			}
		}
	}

}
