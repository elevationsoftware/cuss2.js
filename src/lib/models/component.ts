import {Subject} from "rxjs";
import {Cuss2} from "../cuss2";
import {DataExchange, EnvironmentComponent, EventHandlingCodes, PlatformData, StatusCodes} from "../..";


export class Component {
	_component: EnvironmentComponent;
	id: number;
	onmessage: Subject<any> = new Subject<any>();
	api: any;
	required: boolean = true;
	eventHandlingCode: EventHandlingCodes = EventHandlingCodes.UNAVAILABLE;
	status: StatusCodes = StatusCodes.OK;

	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		this._component = component;
		this.id = component.componentID as number;
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

	_handleMessage(data:any) {
		this.onmessage.next(data);
	}

	get active() : boolean {
		return false;//Boolean(this._component.);
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

export class BarcodeReader extends Component {}
export class DocumentReader extends Component {}
export class PaymentDevice extends Component {}
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
export class BagTagPrinter extends Printer {}
export class BoardingPassPrinter extends Printer {}

export class Feeder extends Component {
	printer?: Printer;
}
export class Dispenser extends Component {
	printer?: Printer;
}
export class Keypad extends Component {
	constructor(component: EnvironmentComponent, cuss2: Cuss2) {
		super(component, cuss2);
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

