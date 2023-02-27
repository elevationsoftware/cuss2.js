import {
	ComponentState,
	PlatformData,
	RequestID,
	StatusCodes
} from "cuss2-javascript-models";

export class PlatformResponseError extends Error {
	constructor(pd:PlatformData) {
		super('Platform returned status code: ' + pd.meta.statusCode);
		this.componentID = pd.meta.componentID;
		this.componentState = pd.meta.componentState;
		this.requestID = pd.meta.requestID;
		this.statusCode = pd.meta.statusCode || StatusCodes.SOFTWARE_ERROR;
	}
	componentID?:number;
	componentState: ComponentState;
	requestID:RequestID;
	statusCode: StatusCodes;
}
