"use strict";
exports.__esModule = true;
exports.BiometricProviderMessage = void 0;
var BiometricProviderMessage;
(function (BiometricProviderMessage) {
    BiometricProviderMessage.BiometricFunctionTypeEnum = {
        Associate: 'associate',
        Disassociate: 'disassociate',
        Enroll: 'enroll',
        GetAssociations: 'get-associations',
        Identify: 'identify',
        Preview: 'preview',
        Purge: 'purge',
        Verify: 'verify'
    };
})(BiometricProviderMessage = exports.BiometricProviderMessage || (exports.BiometricProviderMessage = {}));
