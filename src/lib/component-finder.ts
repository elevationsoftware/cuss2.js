import { EnvironmentComponent } from "./interfaces/environmentComponent";
import { RequiredDevices } from "./interfaces/requiredDevices";
import { ComponentName } from "./interfaces/componentNames";
import { EventCodes } from "./interfaces/eventCodes";
import { StatusCodes } from "./interfaces/statusCodes";
import { ReaderTypes } from "./interfaces/readerTypes";
import { ComponentTypes, DataTypes, MediaTypes } from "./interfaces/models";

/**
 * Find a barcode reader by component's characteristics
 * @param comp Component device
 */
export const isBarcodeReader = (comp: EnvironmentComponent): boolean => {
  if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
    const charac = comp.componentCharacteristics[0];
    if (
      charac &&
      charac.dsTypesList &&
      charac.dsTypesList.find((d) => d === DataTypes.BARCODE)
    ) {
      return true;
    }
  }
  return false;
};
/**
 * Find a bbagtag printer by component's characteristics
 * @param comp Component device
 */
export const isBagtagPrinter = (comp: EnvironmentComponent): boolean => {
  if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
    const charac = comp.componentCharacteristics[0];
    if (
      charac &&
      charac.mediaTypesList &&
      charac.mediaTypesList.find((m) => m === MediaTypes.BaggageTag)
    ) {
      return true;
    }
  }
  return false;
};
/**
 * Find a boardingpass printer by component's characteristics
 * @param comp Component device
 */
export const isBoardingpassPrinter = (comp: EnvironmentComponent): boolean => {
  if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
    const charac = comp.componentCharacteristics[0];
    if (
      charac &&
      charac.mediaTypesList &&
      charac.mediaTypesList.find((m) => m === MediaTypes.BaggageTag)
    ) {
      return true;
    }
  }
  return false;
};
/**
 * Find a passport reader by component's characteristics
 * @param comp Component device
 */
export const isPassportReader = (comp: EnvironmentComponent): boolean => {
  if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
    const charac = comp.componentCharacteristics[0];
    if (
      charac &&
      charac.dsTypesList &&
      charac.dsTypesList.find((d) => d === DataTypes.CODELINE) &&
      charac.readerType === ReaderTypes.FlatbedScan
    ) {
      return true;
    }
  }
  return false;
};
/**
 * Find a display by component's characteristics
 * @param comp Component device
 */
export const isDisplay = (comp: EnvironmentComponent): boolean => {
  if (comp.componentType === ComponentTypes.DISPLAY) {
    return true;
  }
  return false;
};
/**
 * Find a display by component's characteristics
 * @param comp Component device
 */
export const isAnnouncement = (comp: EnvironmentComponent): boolean => {
  if (comp.componentType === ComponentTypes.ANNOUNCEMENT) {
    return true;
  }
  return false;
};

const isValidEventCode = (eventCode: EventCodes | undefined): boolean => {
  if (!eventCode) {
    return false;
  }
  const valids = [
    EventCodes.ECOK,
    EventCodes.EVENTHANDLINGREADY,
    EventCodes.READYRELEASEDAPPLICATION,
    EventCodes.RELEASEDREADY
  ];
  return valids.indexOf(eventCode) >= 0;
};
const isValidStatusCode = (statusCode: StatusCodes | undefined): boolean => {
  return statusCode === StatusCodes.OK;
};

const updateObject = (
  comp: RequiredDevices,
  filterFnc: any,
  list: EnvironmentComponent[]
) => {
  const found = list.find((c) => filterFnc(c));
  if (found) {
    const val =
      isValidEventCode(found.eventCode) && isValidStatusCode(found.statusCode);
    comp.found = val;
    comp.status = val;
  }
};

/**
 *
 * @param comp Components required by the cuss application
 * @param list List of available components in the cuss platform
 */
const findComponents = (
  comp: RequiredDevices,
  list: EnvironmentComponent[]
) => {
  switch (comp.name) {
    case ComponentName.BAGTAG_PRINTER:
      updateObject(comp, isBagtagPrinter, list);
      break;
    case ComponentName.BARCODE_READER:
      updateObject(comp, isBarcodeReader, list);
      break;
    case ComponentName.BOARDINGPASS_PRINTER:
      updateObject(comp, isBoardingpassPrinter, list);
      break;
    case ComponentName.PASSPORT_READER:
      updateObject(comp, isPassportReader, list);
      break;
    case ComponentName.DISPLAY:
      updateObject(comp, isDisplay, list);
      break;
  }
};

/**
 * Find all the application required components and check the availability of each.
 * @param comps Component Device
 * @param list Available components in the cuss platform
 */
export const componentFinder = (
  comps: RequiredDevices[],
  list: EnvironmentComponent[]
) => {
  return new Promise((rs, rj) => {
    try {
      comps.forEach((comp) => findComponents(comp, list));
      return rs(true);
    } catch (err) {
      rj(err);
    }
  });
};
