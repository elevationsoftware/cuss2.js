import {BehaviorSubject, Subject} from "rxjs";
import {logger} from "./helper";
import axios from "axios";
import {PlatformData} from "./interfaces/platformData";
import {takeWhile} from "rxjs/operators";
import { CUSS2ApiResponse } from "./interfaces/cUSS2ApiResponse";

export class Connection {
	/**
	 * Retrieve a token from the CUSS Oauth Server using a client id and client secret
	 */
	static authorize(url: string, client_id: string, client_secret: string): Promise<string> {
		logger('[authorize()] url', url);
		return axios.post(url, {client_id, client_secret}, {timeout: 10000})
			.then(({data: {access_token}}: any) => {
				logger("Token acquired", access_token);

				return access_token;
			})
	}

	static async connect(baseURL:string, client_id: string, client_secret: string, tokenURL?: string): Promise<Connection> {
		const connection = new Connection(baseURL, client_id, client_secret, tokenURL);
		await connection._connect();
		return connection;
	}

	private constructor(baseURL:string, client_id: string, client_secret: string, options:any = {}) {
		this.timeout = options.timeout || 10000;
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

	_config = {
		headers: {
			'Authorization': '',
			'Content-Type': 'application/json'
		},
		timeout: 10000
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
			this._auth.client_secret
		);
		this._config.headers.Authorization = 'Bearer ' + access_token;

		return new Promise(async (resolve, reject) => {
			if (this._socket && this._socket.readyState === 1) {
				logger('open socket already exists');
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
				logger("[socket.onopen] open to: " + this._socketURL);
				socket.send(JSON.stringify({access_token}));
			};
			socket.onmessage = (event: any) => {
				logger("[socket.onmessage]", event.data);
				removeListeners();
				const data = JSON.parse(event.data);
				if (data.returnCode) {
					this._socket = socket;
					socket.onmessage = (event) => {
						const data = JSON.parse(event.data);
						this.messages.next(data);
					};
					socket.onclose = () => {
						removeListeners();
						this.onclose.next();
					};
					resolve(true);
				} else {
					reject(new Error('Platform did not confirm token'))
				}
			};
			socket.onclose = () => {
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

	async post(path: string, data?: any): Promise<any> {
		return this._call('post', path, data);
	}

	async get(path: string): Promise<any> {
		return this._call('get', path, false);
	}

	// this consolidates get/post to simplify logging and reply handling
	async _call(type: string, path: string, data:any): Promise<any> {
		logger(`[connection.${type}()] ${path}`);

		const invalidTokenHandler = async (e:any) => {
			if (e.response.status === 401) {
				logger('got a 401 - trying to re-authenticate')
				await this._connect();
				logger('re-trying http request')
				//try again
				return get_or_post();
			}
			throw e;
		};
		const get_or_post = () => type === 'post'?
			axios.post(this._baseURL + path, data, this._config) :
			axios.get(this._baseURL + path, this._config);

		const r = await get_or_post().catch(invalidTokenHandler);

		logger(`[connection.${type}()] ${path} response:\n`, r.data);

		const { requestID, returnCode } = r.data as CUSS2ApiResponse;
		if (returnCode !== 'RC_OK' && (path === '/platform/applications/staterequest/UNAVAILABLE' && returnCode !== 'RC_STATE')) {
			return Promise.reject(new Error('HTTP call failed with: ' + returnCode))
		}
		logger('[connection._call()] waiting for reply with id: ' + requestID);

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
						console.log('>>>>>>>>>>>>>>>>>>>>', pd.functionName, pd.statusCode);
						// if (pd.statusCode === 'OK') {
							resolve(pd);
						// } else {
						// 	reject(new PlatformResponseError(pd));
						// }
						return false;
					}
					return true; // continue getting messages
				})
			)
				.subscribe(()=>{})
		})
	}
}
