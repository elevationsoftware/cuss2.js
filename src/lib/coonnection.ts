import {BehaviorSubject} from "rxjs";
import {logger} from "./helper";
import axios from "axios";
import {APIResponse} from "./interfaces/aPIResponse";
import {PlatformData} from "./interfaces/platformData";

export class Connection {
	constructor(baseURL:string, access_token:string, socket:WebSocket) {
		this.baseURL = baseURL;
		this.access_token = access_token;
		this._config.headers.Authorization = 'Bearer ' + access_token
		this._socket = socket;
		socket.addEventListener('message', (e) => {
			const data = JSON.parse(e.data);
			if (data.requestID) {
				this.messages.next(data)
			}
		})
	}

	baseURL: string;
	access_token: string;
	_socket: WebSocket;
	// events: BehaviorSubject<any> = new BehaviorSubject<any>({});
	messages: BehaviorSubject<any> = new BehaviorSubject<any>({});

	_config = {
		headers: {
			Authorization: '',
			"Content-Type": "application/json"
		}
	};

	async post(path: string, data: any): Promise<any> {
		return this._call(path, data).catch(e => {
			console.error(e);
			throw e;
		});
	}

	async get(path: string): Promise<any> {
		return this._call(path, false);
	}

	// this consolidates get/post to simplify logging and reply handling
	async _call(path: string, data:any): Promise<any> {
		const type = data? 'post' : 'get';
		logger(`[connection.${type}()] ${path}`);

		const r = data?
			await axios.post(this.baseURL + path, data, this._config) :
			await axios.get(this.baseURL + path, this._config);

		logger(`[connection.${type}()] ${path} response:\n`, r.data);

		const { requestID, returnCode } = r.data as APIResponse;
		if (returnCode !== 'RC_OK') {
			return Promise.reject(new Error('HTTP call failed with: ' + returnCode))
		}
		logger('[connection._call()] waiting for reply with id: ' + requestID);

		return new Promise<PlatformData>((resolve, reject) => {
			const subscription = this.messages.subscribe((message:any) => {
				if (message.requestID === requestID) {
					subscription.unsubscribe();
					if (message.statusCode === 'OK') {
						resolve(message as PlatformData);
					} else {
						reject(new Error('Platform returned status code: ' + message.statusCode));
					}
				}
			});
		})
	}
}
