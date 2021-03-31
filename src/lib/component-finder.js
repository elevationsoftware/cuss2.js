"use strict";
exports.__esModule = true;
exports.componentFinder = exports.isAnnouncement = exports.isDisplay = exports.isPassportReader = exports.isBoardingpassPrinter = exports.isBagtagPrinter = exports.isBarcodeReader = void 0;
var componentNames_1 = require("./interfaces/componentNames");
var eventCodes_1 = require("./interfaces/eventCodes");
var statusCodes_1 = require("./interfaces/statusCodes");
var readerTypes_1 = require("./interfaces/readerTypes");
var models_1 = require("./interfaces/models");
/**
 * Find a barcode reader by component's characteristics
 * @param comp Component device
 */
var isBarcodeReader = function (comp) {
    if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
        var charac = comp.componentCharacteristics[0];
        if (charac &&
            charac.dsTypesList &&
            charac.dsTypesList.find(function (d) { return d === models_1.DataTypes.BARCODE; })) {
            return true;
        }
    }
    return false;
};
exports.isBarcodeReader = isBarcodeReader;
/**
 * Find a bbagtag printer by component's characteristics
 * @param comp Component device
 */
var isBagtagPrinter = function (comp) {
    if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
        var charac = comp.componentCharacteristics[0];
        if (charac &&
            charac.mediaTypesList &&
            charac.mediaTypesList.find(function (m) { return m === models_1.MediaTypes.BaggageTag; })) {
            return true;
        }
    }
    return false;
};
exports.isBagtagPrinter = isBagtagPrinter;
/**
 * Find a boardingpass printer by component's characteristics
 * @param comp Component device
 */
var isBoardingpassPrinter = function (comp) {
    if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
        var charac = comp.componentCharacteristics[0];
        if (charac &&
            charac.mediaTypesList &&
            charac.mediaTypesList.find(function (m) { return m === models_1.MediaTypes.BaggageTag; })) {
            return true;
        }
    }
    return false;
};
exports.isBoardingpassPrinter = isBoardingpassPrinter;
/**
 * Find a passport reader by component's characteristics
 * @param comp Component device
 */
var isPassportReader = function (comp) {
    if (comp.componentCharacteristics && comp.componentCharacteristics.length) {
        var charac = comp.componentCharacteristics[0];
        if (charac &&
            charac.dsTypesList &&
            charac.dsTypesList.find(function (d) { return d === models_1.DataTypes.CODELINE; }) &&
            charac.readerType === readerTypes_1.ReaderTypes.FlatbedScan) {
            return true;
        }
    }
    return false;
};
exports.isPassportReader = isPassportReader;
/**
 * Find a display by component's characteristics
 * @param comp Component device
 */
var isDisplay = function (comp) {
    if (comp.componentType === models_1.ComponentTypes.DISPLAY) {
        return true;
    }
    return false;
};
exports.isDisplay = isDisplay;
/**
 * Find a display by component's characteristics
 * @param comp Component device
 */
var isAnnouncement = function (comp) {
    if (comp.componentType === models_1.ComponentTypes.ANNOUNCEMENT) {
        return true;
    }
    return false;
};
exports.isAnnouncement = isAnnouncement;
var isValidEventCode = function (eventCode) {
    if (!eventCode) {
        return false;
    }
    var valids = [
        eventCodes_1.EventCodes.ECOK,
        eventCodes_1.EventCodes.EVENTHANDLINGREADY,
        eventCodes_1.EventCodes.READYRELEASEDAPPLICATION,
        eventCodes_1.EventCodes.RELEASEDREADY
    ];
    return valids.indexOf(eventCode) >= 0;
};
var isValidStatusCode = function (statusCode) {
    return statusCode === statusCodes_1.StatusCodes.OK;
};
var updateObject = function (comp, filterFnc, list) {
    var found = list.find(function (c) { return filterFnc(c); });
    if (found) {
        var val = isValidEventCode(found.eventCode) && isValidStatusCode(found.statusCode);
        comp.found = val;
        comp.status = val;
    }
};
/**
 *
 * @param comp Components required by the cuss application
 * @param list List of available components in the cuss platform
 */
var findComponents = function (comp, list) {
    switch (comp.name) {
        case componentNames_1.ComponentName.BAGTAG_PRINTER:
            updateObject(comp, exports.isBagtagPrinter, list);
            break;
        case componentNames_1.ComponentName.BARCODE_READER:
            updateObject(comp, exports.isBarcodeReader, list);
            break;
        case componentNames_1.ComponentName.BOARDINGPASS_PRINTER:
            updateObject(comp, exports.isBoardingpassPrinter, list);
            break;
        case componentNames_1.ComponentName.PASSPORT_READER:
            updateObject(comp, exports.isPassportReader, list);
            break;
        case componentNames_1.ComponentName.DISPLAY:
            updateObject(comp, exports.isDisplay, list);
            break;
    }
};
/**
 * Find all the application required components and check the availability of each.
 * @param comps Component Device
 * @param list Available components in the cuss platform
 */
var componentFinder = function (comps, list) {
    return new Promise(function (rs, rj) {
        try {
            comps.forEach(function (comp) { return findComponents(comp, list); });
            return rs(true);
        }
        catch (err) {
            rj(err);
        }
    });
};
exports.componentFinder = componentFinder;
