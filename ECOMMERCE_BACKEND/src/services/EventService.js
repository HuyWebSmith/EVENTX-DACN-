const Event = require("../models/EventModel");

const createEvent = (newEvent) => {
  return new Promise(async (resolve, reject) => {
    const {
      organizerId,
      organizerEmail,
      organizerName,
      organizerInfo,
      organizerLogoUrl,
      organizerBannerUrl,
      title,
      description,
      eventDate,
      eventStartTime,
      eventEndTime,
      status,
      buyerMessage,
      categoryId,
    } = newEvent;
    try {
      const checkEvent = await Event.findOne({
        title,
      });
      if (checkEvent !== null) {
        return resolve({
          status: "ERR",
          message: "The name of event already registered",
          data: null,
        });
      }
      const createdEvent = await Event.create({
        organizerId,
        organizerEmail,
        organizerName,
        organizerInfo,
        organizerLogoUrl,
        organizerBannerUrl,
        title,
        description,
        eventDate,
        eventStartTime,
        eventEndTime,
        status,
        buyerMessage,
        categoryId,
      });
      if (createdEvent)
        resolve({
          status: "OK",
          message: "SUCCESS",
          data: createdEvent,
        });
      if (!createdEvent) {
        return resolve({
          status: "ERR",
          message: "Create event failed",
          data: null,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};
const updateEvent = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkEvent = await Event.findOne({ _id: id });

      if (checkEvent === null) {
        return resolve({
          status: "ERR",
          message: "The event is not defined",
          data: null,
        });
      }
      const updatedEvent = await Event.findByIdAndUpdate(id, data, {
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
      const checkEvent = await Event.findOne({ _id: id });

      if (checkEvent === null) {
        return resolve({
          status: "ERR",
          message: "The event is not defined",
          data: null,
        });
      }
      await Event.findByIdAndDelete(id);
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
  limit = 8,
  page = 1,
  sortField = "title",
  sortOrder = "asc",
  filterField,
  filterValue
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const totalEvent = await Event.countDocuments();

      const sortObj = {};
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder;
      }
      const query = {};
      if (filterField && filterValue) {
        query[filterField] = { $regex: filterValue, $options: "i" };
      }

      const allEvent = await Event.find(query)
        .limit(Number(limit))
        .skip((page - 1) * limit)
        .sort(sortObj); // sort theo field động

      return resolve({
        status: "OK",
        message: "SUCCESS",
        data: allEvent,
        total: totalEvent,
        pageCurrent: Number(page),
        totalPage: Math.ceil(totalEvent / limit),
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailEvent = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const event = await Event.findOne({ _id: id });

      if (event === null) {
        return resolve({
          status: "ERR",
          message: "The event is not defined",
          data: null,
        });
      }

      return resolve({
        status: "OK",
        message: "FINDING USER SUCCESS",
        data: event,
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
};
