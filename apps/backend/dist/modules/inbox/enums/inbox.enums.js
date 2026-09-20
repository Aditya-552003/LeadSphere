"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryStatus = exports.MessageDirection = exports.SenderType = exports.ConversationStatus = exports.ConversationChannel = void 0;
var ConversationChannel;
(function (ConversationChannel) {
    ConversationChannel["EMAIL"] = "email";
    ConversationChannel["WHATSAPP"] = "whatsapp";
})(ConversationChannel || (exports.ConversationChannel = ConversationChannel = {}));
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["OPEN"] = "open";
    ConversationStatus["CLOSED"] = "closed";
    ConversationStatus["ARCHIVED"] = "archived";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var SenderType;
(function (SenderType) {
    SenderType["USER"] = "user";
    SenderType["LEAD"] = "lead";
    SenderType["SYSTEM"] = "system";
})(SenderType || (exports.SenderType = SenderType = {}));
var MessageDirection;
(function (MessageDirection) {
    MessageDirection["INBOUND"] = "inbound";
    MessageDirection["OUTBOUND"] = "outbound";
})(MessageDirection || (exports.MessageDirection = MessageDirection = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["SENT"] = "sent";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["READ"] = "read";
    DeliveryStatus["FAILED"] = "failed";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
//# sourceMappingURL=inbox.enums.js.map