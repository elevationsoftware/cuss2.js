import {BehaviorSubject, Subject} from "rxjs";
import {helpers, log} from "./helper";
import * as rax from 'retry-axios';
import axios from "axios";
import {PlatformData} from "./interfaces/platformData";
import {takeWhile} from "rxjs/operators";
import { CUSS2ApiResponse } from "./interfaces/cUSS2ApiResponse";
import {PlatformResponseError} from "./models/platformResponseError";
import {ReturnCodes} from "./interfaces/returnCodes";

const axiosClient = axios.create();
axiosClient.defaults.raxConfig = {
	instance: axiosClient,
	retry: 9999,
	noResponseRetries: 9999,
	httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
};
rax.attach(axiosClient);

/**
 * @class Connection
 */
export class Connection {
	/**
	 * Retrieve a token from the CUSS Oauth Server using a client id and client secret
	 */
	static authorize(url: string, client_id: string, client_secret: string, timeout: number = 10000): Promise<string> {
		log('info', `Authorizing client '${client_id}'`, url);

		return axiosClient.post(url, {client_id, client_secret}, {timeout})
			.then(({data: {access_token}}: any) => {
				log('info', "Token acquired", access_token);

				return access_token;
			})
	}

	/**
	 * Connects to a CUSS Platform at the provided URL
	 */
	static async connect(baseURL:string, client_id: string, client_secret: string, tokenURL?: string): Promise<Connection> {
		const connection = new Connection(baseURL, client_id, client_secret, tokenURL);
		let delay = .5;
		function connect() : Promise<any> {
			return connection._connect().catch(async (err) => {
				log('info', 'Websocket connection failed: '+err.message , err);
				delay *= 2;
				log('info', `Retrying Websocket connection in ${delay} seconds`);
				await new Promise((resolve) => setTimeout(resolve, delay* 1000));
				return connect();
			});
		}
		await connect();
		return connection;
	}

	private constructor(baseURL:string, client_id: string, client_secret: string, options:any = {}) {
		this.timeout = options.timeout || 30000;
		this.pingInterval = options.pingInterval || this.pingInterval
		const endOfHostname = baseURL.indexOf('?');
		if (endOfHostname > -1) {
			baseURL = baseURL.substr(0, endOfHostname);
		}
		if(baseURL.endsWith('/')) {
			baseURL = baseURL.substr(0, baseURL.length-1)
		}
		this._baseURL = baseURL;

		let tokenURL = options.tokenURL;
		if (!tokenURL) {
			tokenURL = baseURL + '/oauth/token';
		}
		this._auth = { url: tokenURL, client_id, client_secret };

		let protocol = /^https/.test(baseURL) ? "wss" : "ws";
		this._socketURL = protocol + baseURL.replace(/^https?/, '') + '/platform/subscribe';
	}

	_auth: any;
	_baseURL: string;
	_socketURL: string;
	_socket?: WebSocket;
	messages: BehaviorSubject<any> = new BehaviorSubject<any>({});
	onclose: Subject<void> = new Subject();
	pingInterval = 15000;
	lastPong = 0;
	_pinger: any = 0;

	_config = {
		headers: {
			'Authorization': '',
			'Content-Type': 'application/json'
		},
		timeout: 30000
	};

	get timeout() : number {
		return this._config.timeout;
	}
	set timeout(t: number) {
		this._config.timeout = t;
	}

	async _connect() : Promise<any> {
		const access_token = await Connection.authorize(
			this._auth.url,
			this._auth.client_id,
			this._auth.client_secret,
			this.timeout
		);
		this._config.headers.Authorization = 'Bearer ' + access_token;

		return new Promise(async (resolve, reject) => {
			if (this._socket && this._socket.readyState === 1) {
				log('error', 'open socket already exists');
				return resolve(true);
			}
			const socket = new WebSocket(this._socketURL);

			function removeListeners() {
				socket.onopen = null;
				socket.onclose = null;
				socket.onerror = null;
				socket.onmessage = null
			}
			socket.onopen = () => {
				log('info', "Socket opened; Sending Token...", this._socketURL);
				socket.send(JSON.stringify({access_token}));
			};
			socket.onmessage = (event: any) => {
				log('verbose', "[socket.onmessage]", event.data);
				const data = JSON.parse(event.data);
				if (data.description === 'Client already connected') {
					removeListeners();
					log('error', data.description, event.data);
					return reject(new Error('Client already connected'))
				}

				if (data.description === 'Client authorized' && data.returnCode === 'RC_OK') {
					removeListeners();
					log('info', "Token Confirmed", event.data);
					this._socket = socket;
					this.lastPong = Date.now() + (this.pingInterval + 2000);
					this._startPingPong();

					socket.onmessage = (event) => {
						const data = JSON.parse(event.data);
						if (data.pong) {
							// move the expiration time ahead
							return this.lastPong = Date.now() + (this.pingInterval + 2000);
						}
						this.messages.next(data);
					};
					socket.onclose = () => {
						removeListeners();
						this.onclose.next();
					};
					resolve(true);
				}
			};
			const rejectionHandler = () => {
				log('error', "Socket closed: Invalid Token");
				removeListeners();
				reject(new Error('Invalid Token'))
			};
			socket.onclose = rejectionHandler;
			socket.onerror = rejectionHandler;
		});
	}
	_startPingPong() {
		const ping = () => {
			this._socket?.send(`{ "ping": ${Date.now()} }`);
		};
		clearInterval(this._pinger);
		this._pinger = setInterval(() => {
			if(this.lastPong < Date.now()) {
				clearInterval(this._pinger);
				this._socket?.close();
			}
			else{
				log('info', 'pong OK.', this.lastPong - Date.now());
				ping();
			}
		}, this.pingInterval);
	}

	async post(path: string, data?: any): Promise<any> {
		return this._call('post', path, data);
	}

	async get(path: string): Promise<any> {
		return this._call('get', path, false);
	}

	// this consolidates get/post to simplify logging and reply handling
	async _call(type: string, path: string, data:any): Promise<any> {
		log("verbose", `[connection.${type}()] ${path}`);

		const invalidTokenHandler = async (e:any) => {
			if (e.response?.status === 401) {
				log("verbose",'got a 401 - trying to re-authenticate')
				await this._connect();
				log("verbose",'re-trying http request');
				//try again
				return get_or_post();
			}
			throw e;
		};
		const get_or_post = () => type === 'post'?
			axiosClient.post(this._baseURL + path, data, this._config) :
			axiosClient.get(this._baseURL + path, this._config);

		const r = await get_or_post().catch(invalidTokenHandler);

		log("verbose",`[connection.${type}()] ${path} response:\n`, r.data);

		const { requestID, returnCode } = r.data as CUSS2ApiResponse;
		if (returnCode !== ReturnCodes.OK || (path === '/platform/applications/staterequest/UNAVAILABLE' && returnCode === ReturnCodes.STATE)) {
			return Promise.reject(new Error('HTTP call failed with: ' + returnCode))
		}
		log("verbose",'[connection._call()] waiting for reply with id: ' + requestID);

		return new Promise<PlatformData>((resolve, reject) => {
			let timedout = false;
			setTimeout(() => {
				timedout = true;
				reject(new Error(`TIMEOUT waiting for requestID ${requestID} of ${path}`))
			}, this._config.timeout);
			this.messages.pipe(
				takeWhile(message => {
					if (timedout) return false;
					if (message.toApplication?.requestID === requestID) {
						const pd = message.toApplication as PlatformData;
						if (helpers.isNonCritical(pd.statusCode)) {
							resolve(pd);
						} else {
							reject(new PlatformResponseError(pd));
						}
						return false;
					}
					return true; // continue getting messages
				})
			)
				.subscribe(()=>{})
		})
	}
}
