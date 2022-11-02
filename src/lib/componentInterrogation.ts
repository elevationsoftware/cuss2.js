import {CUSSDataTypes} from "./interfaces/cUSSDataTypes";
import {MediaTypes} from "./interfaces/mediaTypes";
import {ComponentTypes} from "./interfaces/componentTypes";
import {ComponentCharacteristics} from "./interfaces/componentCharacteristics";
import {EnvironmentComponent} from "./interfaces/environmentComponent";
import {DeviceTypes} from "./interfaces/deviceTypes";

const dsTypesHas = (charac0:ComponentCharacteristics, type: CUSSDataTypes) => {
	return charac0?.dsTypesList?.find((d) => d === type);
}
const mediaTypesHas = (mediaTypes:MediaTypes[], type: MediaTypes) => {
	return mediaTypes?.find((m) => m === type);
}

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
		return charac0.deviceTypesList?.[0] === DeviceTypes.PRINT && mediaTypesHas(mediaTypes, MediaTypes.BAGGAGETAG);
	}

	static isBoardingPassPrinter = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return charac0.deviceTypesList?.[0] === DeviceTypes.PRINT && mediaTypesHas(mediaTypes, MediaTypes.BOARDINGPASS);
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

	static isIllumination = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		return charac0.deviceTypesList?.[0] === DeviceTypes.ILLUMINATION;
	}

	static isHeadset = (component:EnvironmentComponent) => {
		if (component.componentType !== ComponentTypes.MEDIAINPUT) return;
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return charac0.deviceTypesList?.[0] === DeviceTypes.ASSISTIVE && mediaTypesHas(mediaTypes, MediaTypes.AUDIO);
	}

	static isScale = (component:EnvironmentComponent) => {
		if (component.componentType !== ComponentTypes.DATAINPUT) return;
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return charac0.deviceTypesList?.[0] === DeviceTypes.SCALE && mediaTypesHas(mediaTypes, MediaTypes.BAGGAGE);
	}
	static isFaceReader = (component:EnvironmentComponent) => {
		//return component.componentDescription === 'Face Reader';
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		return dsTypesHas(charac0, CUSSDataTypes.BIOMETRIC);
	}

}
