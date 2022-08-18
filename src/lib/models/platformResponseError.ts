import { ComponentState, RequestID, StatusCodes } from "../..";
import { PlatformData } from "../interfaces/platformData";

export class PlatformResponseError extends Error {
	constructor(pd:PlatformData) {
		super('Platform returned status code: ' + pd.statusCode);
		this.componentID = pd.componentID;
		this.componentState = pd.componentState;
		this.requestID = pd.requestID;
		this.statusCode = pd.statusCode;
	}
	componentID?:number;
	componentState: ComponentState;
	requestID:RequestID;
	statusCode:StatusCodes;

	// `componentState` used to be called `eventHandlingCode`
	// TODO: REMOVE when not needed anymore
	get eventHandlingCode() {
		return this.componentState
	}
}
