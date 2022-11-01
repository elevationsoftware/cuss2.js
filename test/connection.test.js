const {expect} = require('chai');
const EventEmitter = require('events').EventEmitter;
const proxyquire = require('proxyquire');

const asyncish = (fn) => { setTimeout(fn, 100) };

const pretendServer = new EventEmitter();
pretendServer.handle = function (type, url, data, resolve, reject) {
	//console.log('pretendServer.handle', type, url);
	const id = (new Date()).getTime().toString();

	const response = { requestID: id, statusCode: 'OK' };
	if (url.endsWith('/ping')) {
		response.data = 'pong'
	}
	else if (url.endsWith('/expire/test')) {

	}
	else {
		throw new Error("I don't know what to do with URL: " + url)
	}

	resolve({data: { requestID:id, returnCode:"RC_OK" }});

	asyncish(() => {
		this.emit('message', {data: JSON.stringify({
				toApplication: response
		})});
	});
};

const {Connection} = proxyquire('../dist/connection.js', { 'axios': {
	create: () => ({
		defaults: {},
		interceptors: {
			response: {
				use: () => {},
				eject: () => {},
			}
		},
		get: async (url) => {
			return new Promise((resolve, reject) => {
				asyncish(() => {
					pretendServer.handle('get', url, {}, resolve, reject)
				})
			})
		},
		post: async (url, data) => {
			// console.log('mock post', url)
			return new Promise((resolve, reject) => {
				asyncish(() => {

					if (url.endsWith('/token')) {
						const {client_id, client_secret} = data

						if (client_secret === '🤫') {
							resolve({data: {access_token: client_id}});
						}
						else {
							reject(new Error('Invalid Credentials'));
						}
						return;
					}

					if (url.endsWith('/expire/test') && data.count === 0) {
						//e.response.status
						data.count++;
						reject({ response: { status: 401 }});
						return;
					}

					pretendServer.handle('post', url, data, resolve, reject)
				})
			})
		}
	})
}});

global.WebSocket = function WebSocket(url) {
	const fake = {
		readyState: 1,
		onopen: null,
		onclose: null,
		onerror: null,
		onmessage: null,
		send: (data) => {
			asyncish(() => {
				if (data === '{"access_token":"reject"}') {
					if(fake.onclose) fake.onclose();
				}
				else if (data === '{"access_token":"gimme error"}') {
					if (fake.onerror) fake.onerror(new Error('Here is your error'));
				}
				else if (data === '{"access_token":"no returnCode"}') {
					if (fake.onmessage) fake.onmessage({data:'{}'});
				}
				else {
					if (fake.onmessage) fake.onmessage({data:'{"returnCode": "RC_OK"}'});
				}
			})
		},
		close: () => {
			pretendServer.off('message', messageHandler);
		}
	};
	const messageHandler = (data) => {
		if (fake.onmessage) fake.onmessage(data);
	}
	pretendServer.on('message', messageHandler);

	asyncish(() => fake.onopen())
	return fake;
};


describe('Connection', function () {
	let conn;
	afterEach(() => {
		// this removes the event listener so it doesn't exceed max listeners
		if (conn) conn._socket.close()
		conn = undefined;
	});


	describe('authorize()', function () {
		it('should get a token', async function () {
			const token = await Connection.authorize('https://localhost/oauth/token', 'GIVE_ME_BACK_THIS_AS_THE_TOKEN', '🤫');
			expect(token).to.be.an('object')
			expect(token).to.have.property('access_token')
			expect(token.access_token).to.be.a('string')
			expect(token.access_token).to.equal('GIVE_ME_BACK_THIS_AS_THE_TOKEN');
		});

		it('should return an error if credentials fail', async function () {
			try {
				const token = await Connection.authorize('https://localhost/oauth/token', 'whatever', 'wrong');
				throw new Error('Bad authorization should have failed');
			}
			catch(e) {
				expect(e).to.be.an('error');
				expect(e.message).to.equal('Invalid Credentials');
			}
		});
	});

	describe('Instance via connect() factory', function () {

		it('should connect and return a Connection instance', async function () {
			conn = await Connection.connect('https://localhost', 'whatever', '🤫');
			expect(conn).to.be.an.instanceof(Connection)
		});

		it('should store the access_token in the _config', async function () {
			conn = await Connection.connect('http://local.host/path/to/api?query=igone', 'GIVE_ME_BACK_THIS_AS_THE_TOKEN', '🤫');
			expect(conn._config.access_token).to.equal('GIVE_ME_BACK_THIS_AS_THE_TOKEN')
		});

		it('should strip of any query and trailing slash for the baseURL', async function () {
			conn = await Connection.connect('https://local.host/path/to/api?query=igone', 'whatever', '🤫');
			expect(conn._baseURL).to.equal('https://local.host/path/to/api')
		});

		it('should create a ws schema when http is used', async function () {
			conn = await Connection.connect('http://local.host/path/to/api?query=igone', 'whatever', '🤫');
			expect(conn._socketURL).to.equal('ws://local.host/path/to/api/platform/subscribe')
		});

		it('should create a wss schema when https is used', async function () {
			conn = await Connection.connect('https://local.host/path/to/api?query=igone', 'whatever', '🤫');
			expect(conn._socketURL).to.equal('wss://local.host/path/to/api/platform/subscribe')
		});

		it('should default the tokenURL to baseURL+/oauth/token', async function () {
			conn = await Connection.connect('https://local.host/path/to/api?query=igone', 'whatever', '🤫');
			expect(conn._auth.url).to.equal('https://local.host/path/to/api/oauth/token')
		});

		it('should use a custom tokenURL if provided', async function () {
			conn = await Connection.connect('https://localhost', 'whatever', '🤫', {tokenURL:'http://custom.url/token'});
			expect(conn._auth.url).to.equal('http://custom.url/token')
		});

		// This was the old way of sending the token....
		// describe('Failure paths', function () {
		//
		// 	it('should throw if unknown response after websocket gets the token', async function () {
		// 		try {
		// 			conn = await Connection.connect('https://localhost', 'gimme error', '🤫');
		// 			throw new Error('error response should have failed');
		// 		}
		// 		catch(e) {
		// 			expect(e).to.be.an('error');
		// 			expect(e.message).to.equal('Here is your error');
		// 		}
		// 	});
		//
		// 	it("should close the connection if it doesn't like the token", async function () {
		// 		try {
		// 			conn = await Connection.connect('https://localhost', 'reject', '🤫');
		// 			throw new Error('rejection should have failed');
		// 		}
		// 		catch(e) {
		// 			expect(e).to.be.an('error');
		// 			expect(e.message).to.equal('Invalid Token');
		// 		}
		// 	});
		//
		// 	it("should throw if it doesn't confirm the token", async function () {
		// 		try {
		// 			conn = await Connection.connect('https://localhost', 'no returnCode', '🤫');
		// 			throw new Error('rejection should have failed');
		// 		}
		// 		catch(e) {
		// 			expect(e).to.be.an('error');
		// 			expect(e.message).to.equal('Platform did not confirm token');
		// 		}
		// 	});
		//
		// });
	});
});
