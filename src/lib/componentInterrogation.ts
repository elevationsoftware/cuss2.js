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
const deviceTypesHas = (deviceTypes: DeviceTypes[] | undefined, type: DeviceTypes) => {
	return deviceTypes?.find((m) => m === type);
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
		return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.PRINT) && mediaTypesHas(mediaTypes, MediaTypes.BAGGAGETAG);
	}

	static isBoardingPassPrinter = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.PRINT) && mediaTypesHas(mediaTypes, MediaTypes.BOARDINGPASS);
	}

	static isDocumentReader = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		const dsTypes = charac0.dsTypesList;
		const dsCheck = dsTypes?.find((q) => /DS_TYPES_CODELINE/gi.test(q));
		return mediaTypesHas(mediaTypes, MediaTypes.PASSPORT) || !!dsCheck;
	}

	static isBarcodeReader = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const dsTypes = charac0.dsTypesList;
		const dsCheck = dsTypes?.find((q) => /DS_TYPES_BARCODE/gi.test(q));
		return dsTypesHas(charac0, CUSSDataTypes.BARCODE) || !!dsCheck;
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
		const dsTypes = charac0.dsTypesList;
		return !!dsTypes?.find((q) => /DS_TYPES_KEY/gi.test(q));
	}

	static isIllumination = (component:EnvironmentComponent) => {
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.ILLUMINATION);
	}

	static isHeadset = (component:EnvironmentComponent) => {
		if (component.componentType !== ComponentTypes.MEDIAINPUT) return;
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.ASSISTIVE) && mediaTypesHas(mediaTypes, MediaTypes.AUDIO);
	}

	static isScale = (component:EnvironmentComponent) => {
		if (component.componentType !== ComponentTypes.DATAINPUT) return;
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.SCALE) && mediaTypesHas(mediaTypes, MediaTypes.BAGGAGE);
	}

	static isFaceReader = (component:EnvironmentComponent) => {
		//return component.componentDescription === 'Face Reader';
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		return dsTypesHas(charac0, CUSSDataTypes.BIOMETRIC);
	}
	
	static isCamera = (component: EnvironmentComponent) => {
		if (component.componentType !== ComponentTypes.DATAINPUT) return;
		const charac0 = component.componentCharacteristics?.[0];
		if (!charac0) return;
		const mediaTypes = charac0.mediaTypesList;
		return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.CAMERA) && mediaTypesHas(mediaTypes, MediaTypes.IMAGE);
	}

}
