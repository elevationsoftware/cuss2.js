"use strict";
exports.__esModule = true;
exports.CommonUseBiometricMessage = void 0;
var CommonUseBiometricMessage;
(function (CommonUseBiometricMessage) {
    CommonUseBiometricMessage.DocumentTypeEnum = {
        Characteristics: 'characteristics',
        BiometricProviderMessage: 'biometricProviderMessage',
        ErrorResponse: 'errorResponse'
    };
    CommonUseBiometricMessage.ErrorResponseEnum = {
        DataError: 'data-error',
        FormatError: 'format-error',
        Illogical: 'illogical'
    };
})(CommonUseBiometricMessage = exports.CommonUseBiometricMessage || (exports.CommonUseBiometricMessage = {}));
