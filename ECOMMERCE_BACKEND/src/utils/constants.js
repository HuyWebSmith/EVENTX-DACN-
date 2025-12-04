// constants.js

const ORDER_STATUSES = [
  "Pending",
  "Completed",
  "Cancelled",
  "Failed",
  "Refunded",
];
const EVENT_STATUSES = [
  "Draft",
  "Pending",
  "Approved",
  "Rejected",
  "Ongoing",
  "Finished",
  "Cancelled",
];

const TICKET_TYPES = ["GeneralAdmission", "VIP", "EarlyBird", "Free"];
const TICKET_STATUSES = ["ConVe", "HetVe", "SapBan"];
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
