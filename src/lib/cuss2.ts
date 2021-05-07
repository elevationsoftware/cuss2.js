import axios from "axios";
import { logger,logConfig } from "./helper";
import {EnvironmentLevel} from "./interfaces/environmentLevel";
import {PlatformData} from "./interfaces/platformData";
import {BehaviorSubject} from "rxjs";
import {ApplicationStates} from "./interfaces/applicationStates";
import {ApplicationActivation} from "./interfaces/applicationActivation";
import {ComponentList} from "./interfaces/componentList";

import {Connection} from "./coonnection";
import {DataExchange} from "./interfaces/dataExchange";

const ExecutionModeEnum = ApplicationActivation.ExecutionModeEnum;


export class Cuss2 {
	/**
	 * Retrieve a token from the CUSS Oauth Server using a client id and client secret
	 */
	static authorize(url: string, client_id: string, client_secret: string): Promise<string> {
		logger('[authorize()] url', url)
		return axios.post(url, {client_id, client_secret})
			.then(({data: {access_token}}: any) => {
				logger("Token acquired", access_token);
				return access_token;
			})
			.catch(console.log)
	}

	static async connect(url: string, access_token: string): Promise<Cuss2> {
		return new Promise((resolve, reject) => {
			let protocol = /^https/.test(url) ? "ws" : "wss";
			const socketURL = protocol + url.replace(/^https?/, '') + '/subscribe'

			const socket = new WebSocket(socketURL);

			function removeListeners() {
				socket.onopen = null;
				socket.onclose = null;
				socket.onerror = null;
				socket.onmessage = null
			}
			socket.onopen = () => {
				logger("[socket.onopen] open to: " + socketURL);
				socket.send(JSON.stringify({access_token}));
			};
			socket.onmessage = (event: any) => {
				logger("[socket.onmessage]", event.data)
				removeListeners();
				const data = JSON.parse(event.data);
				if (data.returnCode) {
					const connection = new Connection(url, access_token, socket);
					const cuss2 = new Cuss2(connection);
					cuss2.getEnvironment()
						.then(() => resolve(cuss2))
						.catch((e) => new Error('Failed to query environment'))
				} else {
					reject(new Error('Platform did not confirm token'))
				}
			};
			socket.onclose = (event:any) => {
				logger("[socket.onclose] Socket closed");
				removeListeners();
				reject(new Error('Invalid Token'))
			};

			socket.onerror = (err:any) => {
				removeListeners();
				reject(err);
			};
		});
	}



	private constructor(connection: Connection) {
		this.connection = connection;
		connection.messages.subscribe(e => this._handleWebSocketMessage(e))
	}
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
		if (message.statusCode === undefined) return; // initial value is an empty value

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
		const response = await this.connection.post('/platform/applications/staterequest/' + state, {
			applicationBrand: this.applicationBrand,
			executionMode: this.executionMode,
			accessibleMode: this.accessibleMode,
			executionOptions: this.executionOptions,
			languageID: this.languageID,
			transferData: this.transferData
		});
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
				throw new Error('MEDIA_OUTPUT comonent not found');
			}
			componentID = printer.componentID;
		}
		const dataRecords = {
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
			throw new Error('Invalid componentID: ' + componentID);
		}
		const dataExchange = {
			toPlatform: {
				dataRecords: [{dataStatus: 'DS_OK', data: rawData}]
			}
		};
		return await this.connection.post('/peripherals/setup/' + componentID, dataExchange);
	}
}
