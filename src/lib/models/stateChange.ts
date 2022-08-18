import {ApplicationStateCodes} from "../..";


export class StateChange {
	previous:ApplicationStateCodes;
	current:ApplicationStateCodes;

	constructor(previous:ApplicationStateCodes, current:ApplicationStateCodes) {
		this.previous = previous;
		this.current = current;
	}
}
