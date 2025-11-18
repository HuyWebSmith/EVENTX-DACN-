// constants.js

const ORDER_STATUSES = [
  "Pending",
  "Completed",
  "Cancelled",
  "Failed",
  "Refunded",
];
const EVENT_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Draft",
  "Cancelled",
  "Finished",
];
const TICKET_TYPES = ["GeneralAdmission", "VIP", "EarlyBird", "Free"];
const TICKET_STATUSES = ["ConVe", "HetVe", "SapBan"]; // Tương đương 'ConVe' trong C# là 'Còn Vé'
const BUSINESS_TYPES = ["Individual", "Enterprise", "Organization"];
const NOTIFICATION_TYPES = ["System", "Order", "Review", "EventUpdate"];

module.exports = {
  ORDER_STATUSES,
  EVENT_STATUSES,
  TICKET_TYPES,
  TICKET_STATUSES,
  BUSINESS_TYPES,
  NOTIFICATION_TYPES,
};
