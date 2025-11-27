const EventService = require("../services/EventService");
const EventModel = require("../models/EventModel");

const createEvent = async (req, res) => {
  try {
    // Destructure 5 phần dữ liệu
    const { event, tickets, locations, redInvoice, eventImages } = req.body;

    // 1. KIỂM TRA DỮ LIỆU BẮT BUỘC (Rút gọn)
    if (
      !event ||
      !tickets ||
      !locations ||
      !redInvoice ||
      !eventImages ||
      !event.title ||
      !event.eventDate ||
      !event.eventStartTime ||
      !event.categoryId ||
      tickets.length === 0 ||
      locations.length === 0 ||
      eventImages.length === 0
    ) {
      return res.status(400).json({
        status: "ERR",
        message:
          "Thiếu dữ liệu Event, Tickets, Locations, RedInvoice hoặc EventImages.",
      });
    }

    // 2. GẮN THÔNG TIN ORGANIZER VÀ STATUS MẶC ĐỊNH
    const eventPayload = {
      ...event,

      status: event.status || "Pending",
    };

    // 3. GỌI SERVICE VỚI TẤT CẢ 5 ĐỐI SỐ
    const result = await EventService.createEvent(
      eventPayload,
      tickets,
      locations,
      redInvoice,
      eventImages
    );

    if (result && result.status === "ERR") {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (e) {
    console.error("CreateEvent error:", e);
    return res.status(500).json({
      status: "ERR",
      message: e.message || e.toString(),
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const data = req.body;

    if (!eventId) {
      return res.status(400).json({
        status: "ERR",
        message: "The eventId is required",
      });
    }

    const responseFromService = await EventService.updateEvent(eventId, data);
    // mirror service response and use 200 for OK, 400 for ERR
    if (responseFromService && responseFromService.status === "ERR") {
      return res.status(400).json(responseFromService);
    }
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e,
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      return res.status(400).json({
        status: "ERR",
        message: "The eventId is required",
      });
    }

    const responseFromService = await EventService.deleteEvent(eventId);
    if (responseFromService && responseFromService.status === "ERR") {
      return res.status(400).json(responseFromService);
    }
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e, // show message thực sự
    });
  }
};

const getAllEvent = async (req, res) => {
  const {
    page = 1,
    limit, // để undefined nếu không truyền
    sortField = "title",
    sortOrder = "asc",
    filterField,
    filterValue,
  } = req.query;

  try {
    const pageNum = Number(page) || 1;
    const limitNum = limit !== undefined ? Number(limit) : 0; // 0 = no limit

    const responseFromService = await EventService.getAllEvent(
      limitNum,
      pageNum,
      sortField,
      sortOrder,
      filterField,
      filterValue
    );

    if (responseFromService && responseFromService.status === "ERR") {
      return res.status(400).json(responseFromService);
    }

    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({ status: "ERR", message: e.message });
  }
};

const getDetailEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      return res.status(200).json({
        status: "ERR",
        message: "The eventId is required",
      });
    }

    const responseFromService = await EventService.getDetailEvent(eventId);
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e,
    });
  }
};

const deleteMany = async (req, res) => {
  try {
    const ids = req.body;

    if (!ids) {
      return res.status(400).json({
        status: "ERR",
        message: "The eventId is required",
      });
    }

    const responseFromService = await EventService.deleteManyEvent(ids);
    if (responseFromService && responseFromService.status === "ERR") {
      return res.status(400).json(responseFromService);
    }
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e,
    });
  }
};
const getEventsByOrganizer = async (req, res) => {
  const organizerId = req.params.organizerId;

  try {
    const events = await EventModel.find({ organizerId: organizerId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: "OK",
      message: "SUCCESS",
      data: events,
      total: events.length,
    });
  } catch (e) {
    // Bắt lỗi và trả về phản hồi 500 nếu có vấn đề server
    console.error("LỖI KHI TRUY VẤN SỰ KIỆN THEO ORGANIZER:", e);
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi server khi truy vấn dữ liệu: " + e.message,
    });
  }
};
module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvent,
  getDetailEvent,
  deleteMany,
  getEventsByOrganizer,
};
