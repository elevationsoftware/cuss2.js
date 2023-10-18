import {Subject} from "rxjs";
import {StatusCodes} from "./interfaces/statusCodes";

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
	},
	/**
	 * Safe parsing of JSON data
	 * @param data 
	 * @param fallback 
	 * @returns either parsed data or fallback
	 */
	safeParse: (data: any, fallback:any=null): any => {
		try {
			return JSON.parse(data);
		} catch (e) {
			return fallback;
		}
	}
};

// @ts-ignore
window.isNonCritical = helpers.isNonCritical;

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
