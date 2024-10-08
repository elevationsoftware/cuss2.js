/**
 * Interface providing means to handle real-time events for all predefined CUSS websocket responses
 */
export type DeviceType = 'UNKNOWN' | 'BAG_TAG_PRINTER' | 'BAG_TAG_FEEDER' | 'BAG_TAG_DISPENSER' | 'BOARDING_PASS_PRINTER' | 'BOARDING_PASS_FEEDER' | 'BOARDING_PASS_DISPENSER' | 'BARCODE_READER' | 'PASSPORT_READER' | 'MSR_READER' | 'KEY_PAD' | 'ANNOUNCEMENT' | 'FEEDER' | 'DISPENSER' | 'SCALE' | 'FACE_READER' | 'CAMERA';

export const DeviceType = {
	UNKNOWN: 'UNKNOWN' as DeviceType,
	BAG_TAG_PRINTER: 'BAG_TAG_PRINTED' as DeviceType,
	BAG_TAG_FEEDER: 'BAG_TAG_FEEDER' as DeviceType,
	BAG_TAG_DISPENSER: 'BAG_TAG_DISPENSER' as DeviceType,
	BOARDING_PASS_PRINTER: 'BOARDING_PASS_PRINTED' as DeviceType,
	BOARDING_PASS_FEEDER: 'BOARDING_PASS_FEEDER' as DeviceType,
	BOARDING_PASS_DISPENSER: 'BOARDING_PASS_DISPENSER' as DeviceType,
	BARCODE_READER: 'BARCODE_READER' as DeviceType,
	PASSPORT_READER: 'PASSPORT_READER' as DeviceType,
	MSR_READER: 'MSR_READER' as DeviceType,
	KEY_PAD: 'KEY_PAD' as DeviceType,
	ANNOUNCEMENT: 'ANNOUNCEMENT' as DeviceType,
	FEEDER: 'FEEDER' as DeviceType,
	DISPENSER: 'DISPENSER' as DeviceType,
	ILLUMINATION: 'ILLUMINATION' as DeviceType,
	HEADSET: 'HEADSET' as DeviceType,
	FACE_READER: 'FACE_READER' as DeviceType,
	SCALE: 'SCALE' as DeviceType,
	CAMERA: 'CAMERA' as DeviceType
};
