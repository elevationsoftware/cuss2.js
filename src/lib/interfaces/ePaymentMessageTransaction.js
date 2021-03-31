"use strict";
exports.__esModule = true;
exports.EPaymentMessageTransaction = void 0;
var EPaymentMessageTransaction;
(function (EPaymentMessageTransaction) {
    EPaymentMessageTransaction.TransactionTypeEnum = {
        Cancel: 'cancel',
        PreAuth: 'pre-auth',
        PostAuth: 'post-auth',
        Purchase: 'purchase',
        Refund: 'refund',
        VoidPurchase: 'void-purchase',
        VoidRefund: 'void-refund'
    };
})(EPaymentMessageTransaction = exports.EPaymentMessageTransaction || (exports.EPaymentMessageTransaction = {}));
