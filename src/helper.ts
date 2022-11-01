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
	StatusCodes.WRONGSTATE,
	StatusCodes.OUTOFSEQUENCE,
	StatusCodes.TIMEOUT,
	StatusCodes.SESSIONTIMEOUT,
	StatusCodes.KILLTIMEOUT,
	StatusCodes.SOFTWAREERROR,
	StatusCodes.CRITICALSOFTWAREERROR,
	StatusCodes.CONFIGURATIONERROR,
	StatusCodes.FORMATERROR,
	StatusCodes.LENGTHERROR,
	StatusCodes.DATAMISSING,
	StatusCodes.THRESHOLDERROR,
	StatusCodes.THRESHOLDUSAGE,
	StatusCodes.HARDWAREERROR,
	StatusCodes.NOTREACHABLE,
	StatusCodes.NOTRESPONDING,
	StatusCodes.BAGGAGEFULL,
	StatusCodes.BAGGAGEUNDETECTED,
	StatusCodes.BAGGAGEOVERSIZED,
	StatusCodes.BAGGAGETOOMANYBAGS,
	StatusCodes.BAGGAGEUNEXPECTEDBAG,
	StatusCodes.BAGGAGETOOHIGH,
	StatusCodes.BAGGAGETOOLONG,
	StatusCodes.BAGGAGETOOFLAT,
	StatusCodes.BAGGAGETOOSHORT,
	StatusCodes.BAGGAGEINVALIDDATA,
	StatusCodes.BAGGAGEWEIGHTOUTOFRANGE,
	StatusCodes.BAGGAGEJAMMED,
	StatusCodes.BAGGAGEEMERGENCYSTOP,
	StatusCodes.BAGGAGERESTLESS,
	StatusCodes.BAGGAGETRANSPORTBUSY,
	StatusCodes.BAGGAGEMISTRACKED,
	StatusCodes.BAGGAGEUNEXPECTEDCHANGE,
	StatusCodes.BAGGAGEINTERFERENCEUSER,
	StatusCodes.BAGGAGEINTRUSIONSAFETY,
	StatusCodes.BAGGAGENOTCONVEYABLE,
	StatusCodes.BAGGAGEIRREGULARBAG,
	StatusCodes.BAGGAGEVOLUMENOTDETERMINABLE,
	StatusCodes.BAGGAGEOVERFLOWTUB
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
