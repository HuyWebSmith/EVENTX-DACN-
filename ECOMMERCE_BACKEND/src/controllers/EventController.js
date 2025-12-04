const EventService = require("../services/EventService");
const EventModel = require("../models/EventModel");

// Hàm createEvent (Giữ nguyên - Đã OK)
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

// Hàm updateEvent (Giữ nguyên - Đã OK)
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
      status: "ERR", // Thêm status ERR
      message: e.message || e,
    });
  }
};

// Hàm deleteEvent (Giữ nguyên - Đã OK)
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
      status: "ERR", // Thêm status ERR
      message: e.message || e, // show message thực sự
    });
  }
};

// Hàm getAllEvent (Giữ nguyên - Đã OK)
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

// Hàm getDetailEvent (ĐÃ SỬA: Sửa lỗi mã trạng thái HTTP)
const getDetailEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      // 🎯 SỬA LỖI: Trả về 400 Bad Request nếu thiếu ID
      return res.status(400).json({
        status: "ERR",
        message: "The eventId is required",
      });
    }

    const responseFromService = await EventService.getDetailEvent(eventId);

    // Kiểm tra nếu Service trả về ERR (ví dụ: ID không hợp lệ)
    if (responseFromService && responseFromService.status === "ERR") {
      return res.status(400).json(responseFromService);
    }

    return res.status(200).json(responseFromService);
  } catch (e) {
    // 🎯 SỬA LỖI: Trả về lỗi 500 với status ERR
    console.error("Lỗi trong getDetailEvent Controller:", e);
    return res.status(500).json({
      status: "ERR",
      message: e.message || e,
    });
  }
};

// Hàm deleteMany (Giữ nguyên - Đã OK)
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
      status: "ERR", // Thêm status ERR
      message: e.message || e,
    });
  }
};

// Hàm getEventsByOrganizer (Giữ nguyên - Đã OK, thêm status ERR vào catch)
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
// --- Update trạng thái sự kiện ---
const updateEventStatus = async (req, res) => {
  const eventId = req.params.id;
  const { status } = req.body;

  // Kiểm tra trạng thái hợp lệ
  if (!["Pending", "Approved", "Rejected"].includes(status)) {
    return res
      .status(400)
      .json({ status: "ERR", message: "Trạng thái không hợp lệ" });
  }

  try {
    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { status },
      { new: true }
    );

    if (!event) {
      return res
        .status(404)
        .json({ status: "ERR", message: "Không tìm thấy sự kiện" });
    }

    // Realtime: gửi sự kiện qua socket.io nếu có
    if (global._io) {
      global._io.emit("event-status-updated", {
        id: event._id,
        status: event.status,
      });
    }

    return res.status(200).json({
      status: "OK",
      message: "Cập nhật trạng thái thành công",
      data: event,
    });
  } catch (err) {
    console.error("Lỗi updateEventStatus:", err);
    return res
      .status(500)
      .json({ status: "ERR", message: err.message || err.toString() });
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
  updateEventStatus,
};
