import {ApplicationStates} from "../..";
import AppState = ApplicationStates.ApplicationStateCodeEnum;


export class StateChange {
	previous:AppState;
	current:AppState;

	constructor(previous:AppState, current:AppState) {
		this.previous = previous;
		this.current = current;
	}
}
