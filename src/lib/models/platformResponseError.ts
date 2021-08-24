import { EventHandlingCodes, RequestID, StatusCodes } from "../..";
import { PlatformData } from "../interfaces/platformData";

export class PlatformResponseError extends Error {
	constructor(pd:PlatformData) {
		super('Platform returned status code: ' + pd.statusCode);
		this.componentID = pd.componentID;
		this.eventHandlingCode = pd.eventHandlingCode;
		this.requestID = pd.requestID;
		this.statusCode = pd.statusCode;
	}
	componentID?:number;
	eventHandlingCode:EventHandlingCodes;
	requestID:RequestID;
	statusCode:StatusCodes;
}
