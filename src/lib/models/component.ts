import {Subject} from "rxjs";
import {Cuss2} from "../cuss2";
import {DataExchange, EnvironmentComponent, EventHandlingCodes, PlatformData, StatusCodes} from "../..";
import { DeviceType } from '../interfaces/deviceType';


export class Component {
	_component: EnvironmentComponent;
	id: number;
	onmessage: Subject<any> = new Subject<any>();
	api: any;
	required: boolean = true;
	eventHandlingCode: EventHandlingCodes = EventHandlingCodes.UNAVAILABLE;
	status: StatusCodes = StatusCodes.OK;
	deviceType: DeviceType;

	constructor(component: EnvironmentComponent, cuss2: Cuss2, _type: DeviceType = DeviceType.UNKNOWN) {
		this._component = component;
		this.id = component.componentID as number;
		this.deviceType = _type;
		Object.defineProperty(this, 'api', {
			get: () => cuss2.api,
			enumerable: false
		})
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

	enable() {
		return this.api.enable(this.id);
	}
	disable() {
		return this.api.disable(this.id);
	}
	cancel() {
		return this.api.cancel(this.id);
	}
	query() {
		return this.api.getStatus(this.id);
	}


	sendRaw(raw: string) {
		const dataExchange = {
			toPlatform: {
				dataRecords: [
					{
						data: raw as any
					}
				]
			},
		} as DataExchange;

		return this.api.send(this.id, dataExchange);
	}
	setupRaw(raw: string) {
		const dataExchange = {
			toPlatform: {
				dataRecords: [ { data: raw as any } ]
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
}
export class Printer extends Component {
	feeder?: Component;
	dispenser?: Component;

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
}
export class BagTagPrinter extends Printer {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.BAG_TAG_PRINTER);
	}
}
export class BoardingPassPrinter extends Printer {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2, DeviceType.BOARDING_PASS_PRINTER);
	}
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

