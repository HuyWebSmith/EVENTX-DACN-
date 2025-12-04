const EventModel = require("../models/EventModel");
const mongoose = require("mongoose");

// Các Model khác vẫn giữ nguyên
const TicketModel = require("../models/TicketModel");
const LocationModel = require("../models/LocationModel");
const RedInvoiceModel = require("../models/RedInvoice");
const EventImageModel = require("../models/EventImage");

const createEvent = (
  eventPayload,
  tickets,
  locations,
  redInvoice,
  eventImages
) => {
  return new Promise(async (resolve, reject) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Tạo Event (Đảm bảo dùng EventModel)
      const newEvent = await EventModel.create([eventPayload], { session });

      const eventId = newEvent[0]._id;

      // 2. Tạo Tickets (Sử dụng eventId)
      const ticketDocuments = tickets.map((t) => ({ ...t, eventId }));
      await TicketModel.create(ticketDocuments, { session, ordered: true });

      // 3. Tạo Locations (Sử dụng eventId)
      const locationDocuments = locations.map((l) => ({ ...l, eventId }));
      await LocationModel.create(locationDocuments, { session, ordered: true });

      // 4. Tạo RedInvoice (Sử dụng eventId)
      const newRedInvoice = { ...redInvoice, eventId };
      await RedInvoiceModel.create([newRedInvoice], { session });

      // 5. Tạo EventImages (Sử dụng eventId)
      const imageDocuments = eventImages.map((img) => ({ ...img, eventId }));
      await EventImageModel.create(imageDocuments, { session, ordered: true });

      await session.commitTransaction();

      resolve({
        status: "OK",
        message: "Event created successfully",
        data: newEvent[0],
      });
    } catch (error) {
      await session.abortTransaction();
      reject({
        status: "ERR",
        message: error.message || "Lỗi Service",
        details: error.errors,
      });
    } finally {
      session.endSession();
    }
  });
};

const updateEvent = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      // SỬA LỖI: Thay Event.findOne bằng EventModel.findOne
      const checkEvent = await EventModel.findOne({ _id: id });

      if (checkEvent === null) {
        return resolve({
          status: "ERR",
          message: "The event is not defined",
          data: null,
        });
      }
      // SỬA LỖI: Thay Event.findByIdAndUpdate bằng EventModel.findByIdAndUpdate
      const updatedEvent = await EventModel.findByIdAndUpdate(id, data, {
        new: true,
      });
      return resolve({
        status: "OK",
        message: "SUCCESS",
        data: updatedEvent,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteEvent = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      // SỬA LỖI: Thay Event.findOne bằng EventModel.findOne
      const checkEvent = await EventModel.findOne({ _id: id });

      if (checkEvent === null) {
        return resolve({
          status: "ERR",
          message: "The event is not defined",
          data: null,
        });
      }
      // SỬA LỖI: Thay Event.findByIdAndDelete bằng EventModel.findByIdAndDelete
      await EventModel.findByIdAndDelete(id);
      return resolve({
        status: "OK",
        message: "DELETE EVENT SUCCESS",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllEvent = (
  limit = 0,
  page = 1,
  sortField = "title",
  sortOrder = "asc",
  filterField,
  filterValue
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = {};
      if (filterField && filterValue) {
        query[filterField] = { $regex: filterValue, $options: "i" };
      }

      const sortObj = {};
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder === "asc" ? 1 : -1;
      }

      const totalEvent = await EventModel.countDocuments(query);

      let eventsQuery = EventModel.find(query)
        .sort(sortObj)
        .populate("locations")
        .populate("tickets")
        .populate("eventImages");

      if (limit > 0) {
        eventsQuery = eventsQuery.skip((page - 1) * limit).limit(limit);
      }

      const allEvent = await eventsQuery.exec();

      return resolve({
        status: "OK",
        message: "SUCCESS",
        data: allEvent,
        total: totalEvent,
        pageCurrent: Number(page),
        totalPage: limit > 0 ? Math.ceil(totalEvent / limit) : 1,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailEvent = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const event = await EventModel.findOne({ _id: id })
        .populate("locations")
        .populate("tickets")
        .populate("eventImages")
        .exec();

      if (event === null) {
        return resolve({
          status: "ERR",
          message: "The event is not defined",
          data: null,
        });
      }

      return resolve({
        status: "OK",
        message: "FINDING EVENT SUCCESS",
        data: event,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteManyEvent = (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      // SỬA LỖI: Thay Event.deleteMany bằng EventModel.deleteMany
      await EventModel.deleteMany({ _id: ids });
      return resolve({
        status: "OK",
        message: "DELETE EVENT SUCCESS",
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvent,
  getDetailEvent,
  deleteManyEvent,
};
