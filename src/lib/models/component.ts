import {Subject} from "rxjs";
import {Cuss2} from "../cuss2";
import {CUSSDataTypes, DataExchange, EnvironmentComponent, EventHandlingCodes, PlatformData, StatusCodes} from "../..";
import { DeviceType } from '../interfaces/deviceType';
import {PlatformResponseError} from "./platformResponseError";

export class Component {
	_component: EnvironmentComponent;
	id: number;
	onmessage: Subject<any> = new Subject<any>();
	api: any;
	required: boolean = true;
	status: StatusCodes = StatusCodes.OK;
	eventHandlingCode: EventHandlingCodes = EventHandlingCodes.UNAVAILABLE;
	get ready(): boolean { return this.eventHandlingCode === EventHandlingCodes.READY; }
	deviceType: DeviceType;
	pendingCalls: number = 0;

	get pending(): boolean { return this.pendingCalls > 0; }

	constructor(component: EnvironmentComponent, cuss2: Cuss2, _type: DeviceType = DeviceType.UNKNOWN) {
		this._component = component;
		this.id = component.componentID as number;
		this.deviceType = _type;
		Object.defineProperty(this, 'api', {
			get: () => cuss2.api,
			enumerable: false
		});
		cuss2.onmessage.subscribe((data) => {
			if (data?.componentID === this.id) {
				this._handleMessage(data);
			}
		});
	}

	stateChanged(msg: PlatformData): boolean {
		return this.status !== msg.statusCode || this.eventHandlingCode !== msg.eventHandlingCode;
	}

	updateState(msg: PlatformData): void {
		this.status = msg.statusCode;
		this.eventHandlingCode = msg.eventHandlingCode;
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

	enable() {
		return this._call(() => this.api.enable(this.id));
	}
	disable() {
		return this._call(() => this.api.disable(this.id));
	}
	cancel() {
		return this._call(() => this.api.cancel(this.id));
	}
	query() {
		return this._call(() => this.api.getStatus(this.id));
	}

	async sendRaw(raw: string, dsTypes: Array<CUSSDataTypes> = [ CUSSDataTypes.SBDAEA ] ) {
		const dataExchange = {
			toPlatform: {
				dataRecords: [
					{
						data: raw as any, dsTypes: [ CUSSDataTypes.SBDAEA ]
					}
				]
			},
		} as DataExchange;

		await this.enable()
			// Ignore OUTOFSEQUENCE
			.catch((e:PlatformResponseError) => e.statusCode === StatusCodes.OUTOFSEQUENCE ? e : Promise.reject(e));

		return this.api.send(this.id, dataExchange);
	}
	setupRaw(raw: string, dsTypes: Array<CUSSDataTypes> = [ CUSSDataTypes.SBDAEA ]) {
		const dataExchange = {
			toPlatform: {
				dataRecords: [ { data: raw as any, dsTypes: [ CUSSDataTypes.SBDAEA ] } ]
			},
		} as DataExchange;

		return this.api.setup(this.id, dataExchange);
	}
}

export class BarcodeReader extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.BARCODE_READER);
	}
}
export class DocumentReader extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.PASSPORT_READER);
	}
}
export class PaymentDevice extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.MSR_READER);
	}
	//enable/disable FOID
}
export class Printer extends Component {
	feeder?: Component;
	dispenser?: Component;

	logos:any = {
		clear: async (id='') => {
			const response = await this.aeaCommand('LC'+id);
			return response[0] && response[0].indexOf('OK') > -1;
		},
		query: async (id='') => {
			return this._getPairedResponse('LS')
		},
	};

	async setupAndPrintRaw(rawSetupData?: string[], rawData?: string) {
		if (typeof rawData !== 'string') {
			throw new TypeError('Invalid argument: rawData');
		}

		if (Array.isArray(rawSetupData)) {
			for (const rawPectab of rawSetupData) {
				await this.setupRaw(rawPectab);
			}
		}

		await this.sendRaw(rawData);
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
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.DISPENSER);
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
		if (dataRecords?.length === 1) {
			const data = String(dataRecords[0].data);
			this.onbuttonpress.next({
				UP: data.includes('UP'),
				DOWN: data.includes('DOWN'),
				PREVIOUS: data.includes('PREVIOUS'),
				NEXT: data.includes('NEXT'),
				ENTER: data.includes('ENTER'),
				HOME: data.includes('HOME'),
				END: data.includes('END'),
			});
		}
	}
	onbuttonpress: Subject<any> = new Subject<any>();
}
export class Announcement extends Component {
	play() {
		return this.api.announcement.play();
	}
	stop() {
		return this.api.announcement.stop();
	}
	pause() {
		return this.api.announcement.pause();
	}
	resume() {
		return this.api.announcement.resume();
	}
}

