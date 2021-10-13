import {CUSSDataTypes} from "./interfaces/cUSSDataTypes";
import {MediaTypes} from "./interfaces/mediaTypes";
import {ComponentTypes} from "./interfaces/componentTypes";
import {ComponentCharacteristics} from "./interfaces/componentCharacteristics";
import {EnvironmentComponent} from "../../dist";
import {
	Announcement,
	BagTagPrinter, BarcodeReader,
	BoardingPassPrinter,
	CardReader,
	Component,
	Dispenser, DocumentReader,
	Feeder, Keypad
} from "./models/component";

const dsTypesHas = (charac0:ComponentCharacteristics, type: CUSSDataTypes) => {
	return charac0?.dsTypesList?.find((d) => d === type);
}
const mediaTypesHas = (mediaTypes:MediaTypes[], type: MediaTypes) => {
	return mediaTypes?.find((m) => m === type);
}
// const id = String(component.componentID);
// const type = component.componentType;
// const charac0 = component.componentCharacteristics?.[0];
// const mediaTypes = charac0?.mediaTypesList;

export class ComponentInterrogation {
	static isAnnouncement = (component:EnvironmentComponent) => {
		return component.componentType === ComponentTypes.ANNOUNCEMENT;
	}

	static isFeeder = (component:EnvironmentComponent) => {
		return component.componentType === ComponentTypes.FEEDER;
	}

	static isDispenser = (component:EnvironmentComponent) => {
		return component.componentType === ComponentTypes.DISPENSER;
	}

	static isBagTagPrinter = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return mediaTypesHas(mediaTypes, MediaTypes.BAGGAGETAG);
	}

	static isBoardingPassPrinter = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return mediaTypesHas(mediaTypes, MediaTypes.BOARDINGPASS);
	}

	static isDocumentReader = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return mediaTypesHas(mediaTypes, MediaTypes.PASSPORT);
	}

	static isBarcodeReader = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		return dsTypesHas(charac0, CUSSDataTypes.BARCODE);
	}

	static isCardReader = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return mediaTypesHas(mediaTypes, MediaTypes.MAGCARD);
	}

	static isKeypad = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		return dsTypesHas(charac0, CUSSDataTypes.KEY) && dsTypesHas(charac0, CUSSDataTypes.KEYUP) && dsTypesHas(charac0, CUSSDataTypes.KEYDOWN);
	}

}
