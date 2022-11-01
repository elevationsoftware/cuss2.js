import {ApplicationStateCodes} from "cuss2-javascript-models";


export class StateChange {
	previous:ApplicationStateCodes;
	current:ApplicationStateCodes;

	constructor(previous:ApplicationStateCodes, current:ApplicationStateCodes) {
		this.previous = previous;
		this.current = current;
	}
}
