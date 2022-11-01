import {EventEmitter} from 'events'
import {ApplicationData} from "cuss2-javascript-models"
import {helpers} from "./helper.js";
import {PlatformResponseError} from "./models/platformResponseError.js";
if (typeof WebSocket === 'undefined') {
	const {WebSocket} = await import("ws");
}

// const log = console.log
const log = (...args) => {}


/**
 * @class Connection
 */
export class Connection extends EventEmitter {
	/**
	 * Retrieve a token from the CUSS Oauth Server using a client id and client secret
	 * @param {string} url - The url of the CUSS 2 platform
	 * @param {string} client_id - The client_id of the CUSS 2 platform
	 * @param {string} client_secret - The client_secret of the CUSS 2 platform
	 * @returns {Promise<string>} - The token
	 * @example
	 * /// Retrieve a token from the CUSS Oauth Server using a client id and client secret
	 * const token = await Connection.authorize('url', 'my-client-id', 'my-client-secret');
	 */
	static async authorize(url, client_id, client_secret) {
		log('info', `Authorizing client '${client_id}'`, url)

		const response = await fetch(url, {
			method: 'POST',
			// mode: 'cors', // no-cors, *cors, same-origin
			// credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			redirect: 'follow',
			body: JSON.stringify({ client_id, client_secret }) // body data type must match "Content-Type" header
		})
		return response.json()
	}

	/**
	 * Connects to a CUSS Platform at the provided URL
	 * @param {string} baseURL - url of the CUSS Platform
	 * @param {string} client_id - The client_id of the CUSS 2 platform
	 * @param {string} client_secret - The client_secret of the CUSS 2 platform
	 * @param {string} tokenURL - The url of the CUSS Oauth Server
	 * @returns {Promise<Connection>} - The connection object
	 * @example
	 * /// Connects to a CUSS Platform at the provided URL
	 * const connection = await Connection.connect('url', 'my-client-id', 'my-client-secret', 'token-url');
	 */
	static async connect(baseURL, client_id, client_secret, tokenURL) {
		const connection = new Connection(baseURL, client_id, client_secret, tokenURL)
		let delay = .5
		function go() {
			return connection._connect().catch(async (err) => {
				log('info', 'Websocket connection failed: ' + err.message, err)
				delay *= 2
				log('info', `Retrying Websocket connection in ${delay} seconds`)
				await new Promise((resolve) => setTimeout(resolve, delay * 1000))
				return go()
			})
		}
		await go()
		return connection
	}

	_auth
	_baseURL
	_socketURL
	_socket
	pingInterval = 0
	_refresher = 0

	access_token = ''

	constructor(baseURL, client_id, client_secret, options = {}) {
		super()
		this.pingInterval = options.pingInterval || this.pingInterval

		const endOfHostname = baseURL.indexOf('?')
		if (endOfHostname > -1) {
			baseURL = baseURL.substring(0, endOfHostname)
		}
		if (baseURL.endsWith('/')) {
			baseURL = baseURL.substring(0, baseURL.length - 1)
		}
		this._baseURL = baseURL

		let tokenURL = options.tokenURL
		if (!tokenURL) {
			tokenURL = baseURL + '/oauth/token'
		}
		this._auth = { url: tokenURL, client_id, client_secret }

		let protocol = /^https/.test(baseURL) ? "wss" : "ws"
		this._socketURL = protocol + baseURL.replace(/^https?/, '') + '/platform/subscribe'
	}

	async _connect() {
		let access_token, expires = 0
		const _authenticate = async () => {
			log('info', 'Getting access_token')
			if (this._refresher)
				clearTimeout(this._refresher)

			const access_data = await Connection.authorize(
				this._auth.url,
				this._auth.client_id,
				this._auth.client_secret
			)
			access_token = access_data["access_token"]
			expires = Math.max(0, access_data["expires_in"])
			this.access_token = access_token
			if (expires) {
				log('info', `access_token expires in ${expires} seconds`)
				this._refresher = setTimeout(_authenticate, (expires - 1) * 1000)
			}
		}
		await _authenticate()

		return new Promise(async (resolve) => {
			if (this._socket && this._socket.readyState === 1) {
				log('error', 'open socket already exists')
				return resolve(true)
			}
			const socket = new WebSocket(this._socketURL, [], {origin:this._baseURL})

			socket.onopen = () => {
				log('info', "Socket opened: ", this._socketURL)
				this._socket = socket
				resolve(true)
			}
			socket.onmessage = (event) => {
				const data = JSON.parse(event.data)
				if (data.ping) {
					socket.send(`{ "pong": ${Date.now()} }`)
					return this.emit('ping', data)
				}
				if (data.ackCode) {
					return this.emit('ack', data)
				}

				log('socket.onmessage', event)
				this.emit('message', event)
				if (data.meta?.requestID) {
					this.emit(data.meta.requestID, data)
				}
				else {
					console.error('Unknown message', data)
				}
			}
			socket.onclose = (e) => {
				log('Websocket Close:', e.reason)
				this.emit('close', e)
			}
			socket.onerror = (e) => {
				log('Websocket Error:', e)
				this.emit('error', e)
			}
		})
	}

	send(data) {
		if (data instanceof ApplicationData && !data.meta.oauthToken) {
			data.meta.oauthToken = this.access_token
		}
		data = JSON.stringify(data)
		return this._socket.send(data)
	}

	sendAndGetResponse(applicationData) {
		const reqId = applicationData.meta.requestID
		applicationData.meta.oauthToken = this.access_token
		const promise = this.waitFor(reqId)
		this._socket.send(JSON.stringify(applicationData))
		return promise.then(message => {
			const statusCode = message.meta.statusCode;
			if (helpers.isNonCritical(statusCode)) {
				return message;
			} else {
				throw new PlatformResponseError(message);
			}
		})
	}

	close(...args) {
		clearTimeout(this._refresher)
		this._socket.close(...args)
		this.once('close', ()=> {
			super.removeAllListeners()
			this._socket.onopen = undefined
			this._socket.onclose = undefined
			this._socket.onerror = undefined
			this._socket.onmessage = undefined
		})
	}

	waitFor(event) {
		return new Promise((resolve, reject) => {
			const resolver = (e) => {
				this.off('close', catcher)
				resolve(e)
			}
			const catcher = (e) => {
				this.off(event, resolver)
				reject(e)
			}
			this.once(event, resolver)
			this.once('close', catcher)
		})
	}
}
