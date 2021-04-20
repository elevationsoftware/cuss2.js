import { EnvironmentComponent } from './interfaces/environmentComponent';
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
      charac.mediaTypesList.find((m) => m === MediaTypes.BoardingPass)
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

/**
 * An array of component name with a function helper to find them by characteristics. This list can be extended or overider based on clients requirements
 */
export const componentFinderHelper = [
  { name: ComponentName.BAGTAG_PRINTER, finder: isBagtagPrinter },
  { name: ComponentName.BARCODE_READER, finder: isBarcodeReader },
  { name: ComponentName.BOARDINGPASS_PRINTER, finder: isBoardingpassPrinter },
  { name: ComponentName.PASSPORT_READER, finder: isPassportReader },
  { name: ComponentName.DISPLAY, finder: isDisplay },
  { name: ComponentName.ANNOUNCEMENT, finder: isAnnouncement }
];

export const getCompomentName = (component: EnvironmentComponent) => {
  for (let i = 0; i < componentFinderHelper.length; i++) {
      if (componentFinderHelper[i].finder(component)) {
        component.componentName = componentFinderHelper[i].name
        component.active = isValidEventCode(component.eventCode) && isValidStatusCode(component.statusCode);
        break;
      }
  }
};

/**
 * 
 * @param name Component name
 * @param finder Method used to identify component by characteristics
 * @returns addComponentFinder in order to enable chaning calls
 */
export const addComponentFinder = (name: ComponentName, finder: any) => {
  const found = componentFinderHelper.find(c => c.name === name);
  if (found) {
    found.finder = finder;
    return addComponentFinder;
  }
  componentFinderHelper.push({ name, finder });
  return addComponentFinder;
}
