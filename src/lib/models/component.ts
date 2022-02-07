import {BehaviorSubject, combineLatest, Subject} from "rxjs";
import {Cuss2} from "../cuss2";
import {
	ApplicationData,
	CUSSDataTypes,
	DataExchange,
	DataRecord,
	EnvironmentComponent,
	EventHandlingCodes,
	IlluminationDataLightColor,
	PlatformData,
	StatusCodes
} from "../..";
import {DeviceType} from '../interfaces/deviceType';
import {PlatformResponseError} from "./platformResponseError";
import {take, timeout} from "rxjs/operators";

/**
 * @class Component
 * @classdesc General object representing a CUSS component with methods and properties to interact with it.
 * @param {EnvironmentComponent} component 
 * @param {Cuss2} cuss2 
 * @param {DeviceType} _type 
 */
export class Component {
	_component: EnvironmentComponent;
	/**
	 * @property {number} id - Numeric ID assigned to the component; used for identification of a specific component.
	 */
	id: number;
	/**
	 * @property {Subject<PlatformData>} onmessage - Observable that emits when a message is received from the component.
	 */
	onmessage: Subject<PlatformData> = new Subject<PlatformData>();
	api: any;
	/**
	 * @property {boolean} required - 
	 */
	required: boolean = false;
	/**
	 * @property {BehaviorSubject<StatusCodes} statusChanged - Observable that emits the status of the component on changes.
	 */
	statusChanged: BehaviorSubject<StatusCodes> = new BehaviorSubject<StatusCodes>(StatusCodes.OK);
	_eventHandlingCode: EventHandlingCodes = EventHandlingCodes.UNAVAILABLE;
	/**
	 * @property {DeviceType} deviceType - The type of device the component is, *See IATA documentation for more details.
	 */
	deviceType: DeviceType;
	pendingCalls: number = 0;
	/**
	 * @property {boolean} enabled - Whether the component is enabled or not.
	 */
	enabled: boolean = false;
	pollingInterval = 3000;
	_poller: any;
	parent: any;
	subcomponents: Component[] = []

	/**
	 * @returns {boolean} true if the component is ready
	 */
	get ready(): boolean {
		return this._eventHandlingCode === EventHandlingCodes.READY;
	}
	/**
	 * @property {BehaviorSubject<boolean>} readyStateChanged - emits true when the component is ready
	 */
	readyStateChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	get pending(): boolean { return this.pendingCalls > 0; }
	get status(): StatusCodes { return this.statusChanged.getValue(); }

	constructor(component: EnvironmentComponent, cuss2: Cuss2, _type: DeviceType = DeviceType.UNKNOWN) {
		this._component = component;
		this.id = component.componentID as number;
		this.deviceType = _type;
		Object.defineProperty(this, 'api', {
			get: () => cuss2.api,
			enumerable: false
		});
		cuss2.onmessage.subscribe((data:PlatformData) => {
			if (data?.componentID === this.id) {
				this._handleMessage(data);
			}
		});
		cuss2.deactivated.subscribe(() => {
			this.enabled = false;
		});

		if (component.linkedComponentIDs?.length) {
			const name = this.constructor.name[0].toLowerCase() + this.constructor.name.substr(1)
			const parentId = Math.min(this.id, ...component.linkedComponentIDs)
			if(parentId != this.id) {
				console.log(name, parentId)
				this.parent = cuss2.components[parentId]
				// feeder and dispenser are created in the printer component
				if (this.parent && !this.parent[name]) {
					this.parent.subcomponents.push(this)
					this.parent[name] = this
				}
			}
		}
	}

	stateIsDifferent(msg: PlatformData): boolean {
		return this.status !== msg.statusCode || this._eventHandlingCode !== msg.eventHandlingCode;
	}

	updateState(msg: PlatformData): void {
		if (msg.eventHandlingCode !== this._eventHandlingCode) {
			this._eventHandlingCode = msg.eventHandlingCode;
			if (msg.eventHandlingCode !== EventHandlingCodes.READY) {
				this.enabled = false;
			}
			this.readyStateChanged.next(msg.eventHandlingCode === EventHandlingCodes.READY)
		}
		// Sometimes status is not sent by an unsolicited event so we poll to be sure
		if (!this.ready && this.required && !this._poller && this.pollingInterval > 0) {
			this.pollUntilReady();
		}

		if (this.status !== msg.statusCode) {
			this.statusChanged.next(msg.statusCode);
		}
	}
	pollUntilReady(requireOK = false, pollingInterval = this.pollingInterval) {
		if (this._poller) return;
		const poll = () => {
			if (this.ready && (!requireOK || this.status === StatusCodes.OK)) {
				return this._poller = undefined;
			}

			this._poller = setTimeout(() => {
				this.query().catch(Object).finally(poll)
			}, pollingInterval);
		}
		poll();
	}


	_handleMessage(data:any) {
		this.onmessage.next(data);
	}
	async _call(action:Function) {
		this.pendingCalls++;
		const decrement = (r:any)=>{
			this.pendingCalls--;
			return r;
		};
		return action().then(decrement).catch((e:any) => Promise.reject(decrement(e)))
	}

	enable(...args: any[]) {
		return this._call(() => this.api.enable(this.id))
			.then((r:any) => {
				this.enabled = true;
				return r;
			})
	}
	disable() {
		return this._call(() => this.api.disable(this.id))
			.then((r:any) => {
				this.enabled = false;
				return r;
			})
			.catch((e:PlatformResponseError) => {
				if (e.statusCode === StatusCodes.OUTOFSEQUENCE) {
					this.enabled = false;
					return e;
				}
				return Promise.reject(e);
			});
	}
	cancel() {
		return this._call(() => this.api.cancel(this.id));
	}
	query() {
		return this._call(() => this.api.getStatus(this.id));
	}

	async setup(applicationData: ApplicationData) {
		// {dataRecords: object[]|null = null, illuminationData: object|null = null}
		return await this.api.setup(this.id, {
			toPlatform: applicationData // { dataRecords, illuminationData }
		} as DataExchange);
	}
	async send(applicationData: ApplicationData) {
		// {dataRecords: object[]|null = null, illuminationData: object|null = null}
		return await this.api.send(this.id, {
			toPlatform: applicationData // { dataRecords, illuminationData }
		} as DataExchange);
	}
}
export class DataReaderComponent extends Component {
	data = new Subject<string[]>();
	previousData: string[] = [];

	_handleMessage(data:PlatformData) {
		this.onmessage.next(data);
		if (data.statusCode === StatusCodes.DATAPRESENT && data.dataRecords?.length) {
			this.previousData = data.dataRecords?.map((dr:DataRecord) => dr.data);
			this.data.next(this.previousData)
		}
	}

	async read(ms:number=30000) {
		return new Promise(async(resolve,reject)=>{
				await this.enable();

				const subscription = this.data
					.pipe(take(1))
					.pipe(timeout(ms))
					.subscribe(resolve,reject);

			})
			.finally(() => this.disable());
	}
}
export class BarcodeReader extends DataReaderComponent {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.BARCODE_READER);
	}
}
export class DocumentReader extends DataReaderComponent {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.PASSPORT_READER);
	}
}
export class CardReader extends DataReaderComponent {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.MSR_READER);
	}

	async enablePayment(yes:boolean) {
		await this.setup({dataRecords: [{
			data: '',
			dsTypes: [yes? 'DS_TYPES_PAYMENT_ISO' as CUSSDataTypes : CUSSDataTypes.FOIDISO]
		}]});
	}

	async readPayment(ms:number=30000) {
		await this.enablePayment(true);
		await this.read(ms);
		await this.enablePayment(false);
	}
}

export class Printer extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2, _type: DeviceType) {
		super(component, cuss2, _type);

		const missingLink = (msg:string) => { throw new Error(msg); };
		const linked = component.linkedComponentIDs?.map(id => cuss2.components[id] as Component) || [];

		this.feeder = linked.find(c => c instanceof Feeder) || missingLink('Feeder not found for Printer ' + this.id);
		this.subcomponents.push(this.feeder)

		const d = linked.find(c => c instanceof Dispenser) as Dispenser;
		this.dispenser = d || missingLink('Dispenser not found for Printer ' + this.id);
		this.subcomponents.push(this.dispenser)

		// // @ts-ignore cause you're not smart enough
		// this._superReadyStateChanged = this.readyStateChanged;

		combineLatest([
			super.readyStateChanged,
			this.feeder.readyStateChanged,
			this.dispenser.readyStateChanged
		])
		.subscribe(([printerReady,feederReady,dispenserReady]: boolean[]) => {
			const ready = printerReady && feederReady && dispenserReady;
			if (this.combinedReady !== ready) {
				this._combinedReady = ready;
				this.combinedReadyStateChanged.next(ready);
			}
		});
		this.combinedReadyStateChanged = new BehaviorSubject<boolean>(false);

		// @ts-ignore cause you're not smart enough
		// this._superStatusChanged = this.statusChanged;

		combineLatest([
			super.statusChanged,
			this.feeder.statusChanged,
			this.dispenser.statusChanged
		])
		.subscribe((statuses: StatusCodes[]) => {
			const status = statuses.find(s => s != StatusCodes.OK) || StatusCodes.OK;
			if (this.combinedStatus !== status) {
				this._combinedStatus = status;
				this.combinedStatusChanged.next(status);
			}
		});
		this.combinedStatusChanged = new BehaviorSubject<StatusCodes>(StatusCodes.OK);
		
		cuss2.activated.subscribe(() => {
			if (this.ready) {
				this.enable();
			}
		});
	}

	/**
	 * @property The feeder component linked this printer.
	 */
	feeder: Feeder;
	/**
	 * @property The dispenser component linked this printer.
	 */
	dispenser: Dispenser;
	/**
	 * @property The combined ready state of this printer, feeder, and dispenser; emits true when ready.
	 */
	combinedReadyStateChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	/**
	 * @property The combined status of this printer, feeder, and dispenser; emits on status code changes.
	 */
	combinedStatusChanged: BehaviorSubject<StatusCodes> = new BehaviorSubject<StatusCodes>(StatusCodes.OK);
	get mediaPresentChanged() {
		return this.dispenser.mediaPresentChanged;
	}
	get mediaPresent(): boolean {
		return this.dispenser.mediaPresentChanged.getValue();
	}

	_combinedReady = false;
	/**
	 * The combined ready state of the printer, feeder, and dispenser
	 */
	get combinedReady(): boolean {
		return this._combinedReady;
	}

	_combinedStatus = StatusCodes.OK;
	/**
	 * The combined status of the printer, feeder, and dispenser.
	 */
	get combinedStatus(): StatusCodes {
		return this._combinedStatus;
	}

	updateState(msg: PlatformData): void {
		//CUTnHOLD can cause a TIMEOUT response if the tag is not taken in a certain amount of time.
		// Unfortunately, it briefly considers the Printer to be UNAVAILABLE.
		if (msg.functionName === 'send' && msg.statusCode === StatusCodes.TIMEOUT && msg.eventHandlingCode === EventHandlingCodes.UNAVAILABLE) {
			msg.eventHandlingCode = EventHandlingCodes.READY;
		}
		// if now ready, query linked components to get their latest status
		if (!this.ready && msg.eventHandlingCode === EventHandlingCodes.READY) {
			this.feeder.query().catch(console.error);
			this.dispenser.query().catch(console.error);
		}
		else if (msg.statusCode === StatusCodes.MEDIAPRESENT) {
			this.dispenser.mediaPresentChanged.next(true);
			// query the dispenser- which will start a poller that will detect when the media has been taken
			this.dispenser.query().catch(console.error);
		}

		if (this.combinedReady !== (msg.eventHandlingCode === EventHandlingCodes.READY)) {
			this._combinedReady = !this._combinedReady;
			this.combinedReadyStateChanged.next(!this.combinedReady);
		}

		if (this.combinedStatus !== msg.statusCode && (msg.functionName === 'query' || msg.functionName === '')) {
			this._combinedStatus = msg.statusCode;
			this.combinedStatusChanged.next(msg.statusCode);
		}

		super.updateState(msg);
		// if ((this.ready !== (msg.eventHandlingCode === EventHandlingCodes.READY)) 
		// 	&& ((this.feeder.ready && this.dispenser.ready) !== (msg.eventHandlingCode === EventHandlingCodes.READY))) {
		// 	this._combinedReady = msg.eventHandlingCode === EventHandlingCodes.READY;
		// 	this.readyStateChanged.next(!this.ready);
		// }

		// if (this.status !== msg.statusCode && (msg.functionName === 'query' || msg.functionName === '')
		// 	&& (this.feeder.status === msg.statusCode || this.dispenser.status === msg.statusCode)) {
		// 	this.statusChanged.next(msg.statusCode);
		// }
	}

	async setupAndPrintRaw(rawSetupData: string[], rawData?: string) {
		if (typeof rawData !== 'string') {
			throw new TypeError('Invalid argument: rawData');
		}

		await this.setupRaw(rawSetupData);
		return this.printRaw(rawData);
	}
	async printRaw(rawData: string) {
		return this.sendRaw(rawData)
			.catch((e:PlatformResponseError) => {
				return this.cancel().then(() => { throw e })
			});
	}
	async setupRaw(raw: string|string[], dsTypes: Array<CUSSDataTypes> = [ CUSSDataTypes.ITPS ]) {
		const isArray = Array.isArray(raw);
		if (!raw || (isArray && !raw[0])) {
			return Promise.resolve(isArray? [] : undefined);
		}
		const rawArray:string[] = isArray? raw as string[] : [raw as string];

		const dx = (r:string) => ({
			toPlatform: {
				dataRecords: [ { data: (r || '') as any, dsTypes: dsTypes } ]
			},
		} as DataExchange);

		return await Promise.all(rawArray.map(r => this.api.setup(this.id, dx(r))))
			.then(results => isArray? results : results[0])
	}
	async sendRaw(raw: string, dsTypes: Array<CUSSDataTypes> = [ CUSSDataTypes.ITPS ] ) {
		const dataExchange = {
			toPlatform: {
				dataRecords: [{	data: (raw || '') as any, dsTypes: dsTypes }]
			},
		} as DataExchange;

		return this.api.send(this.id, dataExchange);
	}
	async aeaCommand(cmd:string) {
		const response = await this.setupRaw(cmd);
		return (response.dataRecords||[]).map((r:any)=>r.data||'')
	}
	async getEnvironment() {
		return Cuss2.helpers.deserializeDictionary((await this.aeaCommand('ES'))[0]);
	}
	async _getPairedResponse(cmd:string, n:number=2) {
		const response = (await this.aeaCommand(cmd))[0];
		return Cuss2.helpers.split_every(response.substr(response.indexOf('OK')+2), n) || [];
	}

	logos:any = {
		clear: async (id='') => {
			const response = await this.aeaCommand('LC'+id);
			return response[0] && response[0].indexOf('OK') > -1;
		},
		query: async (id='') => {
			return this._getPairedResponse('LS')
		},
	};
	pectabs:any = {
		clear: async (id='') => {
			const response = await this.aeaCommand('PC'+id);
			return response[0] && response[0].indexOf('OK') > -1;
		},
		query: async () => {
			return this._getPairedResponse('PS')
		},
	};

}
export class BagTagPrinter extends Printer {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.BAG_TAG_PRINTER);
	}

	pectabs:any = {
		clear: async (id='') => {
			const response = await this.aeaCommand('PC'+id);
			return response[0] && response[0].indexOf('OK') > -1;
		},
		query: async () => {
			return this._getPairedResponse('PS', 4)
		},
	};
}
export class BoardingPassPrinter extends Printer {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.BOARDING_PASS_PRINTER);
	}

	templates:any = {
		clear: async (id='') => {
			const response = await this.aeaCommand('TC'+id);
			return response[0] && response[0].indexOf('OK') > -1;
		},
		query: async (id='') => {
			return this._getPairedResponse('TA')
		},
	};
}

export class Feeder extends Component {
	printer?: Printer;
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.FEEDER);
	}
}
export class Dispenser extends Component {
	printer?: Printer;
	mediaPresentChanged: BehaviorSubject<boolean>;
	get mediaPresent(): boolean {
		return this.mediaPresentChanged.getValue();
	}

	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.DISPENSER);

		this.mediaPresentChanged = new BehaviorSubject<boolean>(false);
		this.statusChanged.subscribe((status) => {
			if (status === StatusCodes.MEDIAPRESENT) {
				this.pollUntilReady(true, 100);
				if (!this.mediaPresent) {
					this.mediaPresentChanged.next(true);
				}
			}
			else {
				if (this.mediaPresent) {
					this.mediaPresentChanged.next(false);
				}
			}
		})
	}
}
export class Keypad extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.KEY_PAD);
	}

	_handleMessage(message:PlatformData) {
		super._handleMessage(message);
		if (message.componentID !== this.id) return;

		const dataRecords = message.dataRecords;
		if (dataRecords?.length) {
			const data = dataRecords.map(dr => dr.data);
			this.data.next({
				UP: data.includes('NAVUP'),
				DOWN: data.includes('NAVDOWN'),
				PREVIOUS: data.includes('NAVPREVIOUS'),
				NEXT: data.includes('NAVNEXT'),
				ENTER: data.includes('NAVENTER'),
				HOME: data.includes('NAVHOME'),
				END: data.includes('NAVEND'),
				HELP: data.includes('NAVHELP'),
				VOLUMEUP: data.includes('VOLUMEUP'),
				VOLUMEDOWN: data.includes('VOLUMEDOWN'),
			});
		}
	}
	data: Subject<any> = new Subject<any>();
}
export class Announcement extends Component {
	say(text:string, lang:string='en-US') {
		const xml = `<?xml version="1.0" encoding="UTF-8"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">${text}</speak>`;
		return this.play(xml);
	}
	play(xml:string) {
		return this.api.announcement.play(this.id, xml);
	}
	stop() {
		return this.api.announcement.stop(this.id);
	}
	pause() {
		return this.api.announcement.pause(this.id);
	}
	resume() {
		return this.api.announcement.resume(this.id);
	}
}

export class Illumination extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.ILLUMINATION);
	}
	async enable(duration: number, color?: String|number[], blink?: number[]) {
		// @ts-ignore
		let name = (typeof color === 'string')? (IlluminationDataLightColor.NameEnum)[color] : undefined;
		let rgb = (Array.isArray(color) && color.length === 3)? {red:color[0], green:color[1], blue:color[2]} : undefined;
		let blinkRate = (Array.isArray(blink) && blink.length === 2)? {durationOn:blink[0], durationOff:blink[1]} : undefined;

		if(this.enabled)
			await this.disable();
		await super.enable();
		return await this.send({illuminationData: {duration, lightColor: {name, rgb}, blinkRate}});
	}
}
export class Headset extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.HEADSET);
	}
}
