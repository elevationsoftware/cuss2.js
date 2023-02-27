import {Subject} from "rxjs";
import * as uuid from "uuid";
import {
	ApplicationData,
	ApplicationDataPayload,
	ApplicationDataMeta,
	ApplicationState,
	ApplicationTransfer,
	DataRecordList,
	ScreenResolution,
	IlluminationData,
	BaggageData,
	CommonUsePaymentMessage,
	CommonUseBiometricMessage,
	StatusCodes,
	PlatformDirectives
} from "cuss2-javascript-models";

export { StatusCodes };

export class LogMessage {
	action: string;
	data: any;
	level: string;

	constructor(level:string, action:string, data:any) {
		this.action = action;
		this.level = level;
		this.data = data;
	}
}
export class Logger extends Subject<LogMessage> {}

export const logger = new Logger();
export const log = (level:string, action:string, data?:any) => {
	logger.next(new LogMessage(level, action, data));
};

export const helpers = {
	splitAndFilter: (text:string, delimiter1='#') : string[] => {
		return text.split(delimiter1).filter(p => !!p);
	},
	split_every: (text:string, n:number):string[] => {
		return text.match(new RegExp('.{1,'+n+'}','g')) as string[];
	},
	deserializeDictionary: (text:string, delimiter1='#', delimiter2='=') : object => {
		const out:any = {};
		helpers.splitAndFilter(text, delimiter1).forEach(p => {
			const [ k,v ] = p.split(delimiter2);
			if (v) out[k] = v;
		});
		return out;
	},
	/**
	 * Uses criticalErrors list to determine if an error is critical or not.
	 */
	isNonCritical: (status:StatusCodes) => {
		return !criticalErrors.some(s => s == status)
	}
};

if(typeof window !== 'undefined') {
	// @ts-ignore
	window.isNonCritical = helpers.isNonCritical;
}

const criticalErrors = [
	StatusCodes.CANCELLED,
	StatusCodes.WRONG_STATE,
	StatusCodes.OUT_OF_SEQUENCE,
	StatusCodes.TIMEOUT,
	StatusCodes.SESSION_TIMEOUT,
	StatusCodes.KILL_TIMEOUT,
	StatusCodes.SOFTWARE_ERROR,
	StatusCodes.CRITICAL_SOFTWARE_ERROR,
	StatusCodes.CONFIGURATION_ERROR,
	StatusCodes.FORMAT_ERROR,
	StatusCodes.LENGTH_ERROR,
	StatusCodes.DATA_MISSING,
	StatusCodes.THRESHOLD_ERROR,
	StatusCodes.THRESHOLD_USAGE,
	StatusCodes.HARDWARE_ERROR,
	StatusCodes.NOT_REACHABLE,
	StatusCodes.NOT_RESPONDING,
	StatusCodes.BAGGAGE_FULL,
	StatusCodes.BAGGAGE_UNDETECTED,
	StatusCodes.BAGGAGE_OVERSIZED,
	StatusCodes.BAGGAGE_TOO_MANY_BAGS,
	StatusCodes.BAGGAGE_UNEXPECTED_BAG,
	StatusCodes.BAGGAGE_TOO_HIGH,
	StatusCodes.BAGGAGE_TOO_LONG,
	StatusCodes.BAGGAGE_TOO_FLAT,
	StatusCodes.BAGGAGE_TOO_SHORT,
	StatusCodes.BAGGAGE_INVALID_DATA,
	StatusCodes.BAGGAGE_WEIGHT_OUT_OF_RANGE,
	StatusCodes.BAGGAGE_JAMMED,
	StatusCodes.BAGGAGE_EMERGENCY_STOP,
	StatusCodes.BAGGAGE_RESTLESS,
	StatusCodes.BAGGAGE_TRANSPORT_BUSY,
	StatusCodes.BAGGAGE_MISTRACKED,
	StatusCodes.BAGGAGE_UNEXPECTED_CHANGE,
	StatusCodes.BAGGAGE_INTERFERENCE_USER,
	StatusCodes.BAGGAGE_INTRUSION_SAFETY,
	StatusCodes.BAGGAGE_NOT_CONVEYABLE,
	StatusCodes.BAGGAGE_IRREGULAR_BAG,
	StatusCodes.BAGGAGE_VOLUME_NOT_DETERMINABLE,
	StatusCodes.BAGGAGE_OVERFLOW_TUB
]

export const Build = {
	applicationData: (directive, options={}) => {
		// @ts-ignore
		const {componentID, token, dataObj} = options
		const meta = new ApplicationDataMeta()
		meta.requestID = uuid.v4()
		meta.oauthToken = token
		meta.directive = directive
		meta.componentID = componentID

		const payload = new ApplicationDataPayload()
		if(dataObj instanceof ApplicationState) { payload.applicationState = dataObj }
		if(dataObj instanceof ApplicationTransfer) { payload.applicationTransfer = dataObj }
		if(dataObj instanceof DataRecordList) { payload.dataRecords = dataObj }
		if(dataObj instanceof ScreenResolution) { payload.screenResolution = dataObj }
		if(dataObj instanceof IlluminationData) { payload.illuminationData = dataObj }
		if(dataObj instanceof BaggageData) { payload.bagdropData = dataObj }
		if(dataObj instanceof CommonUsePaymentMessage) { payload.paymentData = dataObj }
		if(dataObj instanceof CommonUseBiometricMessage) { payload.biometricData = dataObj }

		const ad = new ApplicationData(meta)
		ad.payload = payload
		return ad
	},
	stateChange: (desiredState, reasonCode, reason, brand=undefined) => {
		return Build.applicationData(PlatformDirectives.platformApplicationsStaterequest, {
			dataObj: ApplicationState.constructFromObject({
				applicationStateCode: desiredState,
				applicationStateChangeReasonCode: reasonCode,
				applicationStateChangeReason: reason,
				applicationBrand: brand
			})
		})
	}
}
