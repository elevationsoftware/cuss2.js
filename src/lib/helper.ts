import {Subject} from "rxjs";

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
	}
};
