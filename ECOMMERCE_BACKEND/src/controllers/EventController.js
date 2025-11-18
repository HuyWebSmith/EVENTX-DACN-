const EventService = require("../services/EventService");
const createEvent = async (req, res) => {
  try {
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
    } = req.body;

    if (
      !organizerId ||
      !organizerEmail ||
      !organizerName ||
      !title ||
      !eventDate ||
      !eventStartTime ||
      !eventEndTime ||
      !categoryId ||
      !status
    ) {
      return res.status(400).json({
        status: "ERR",
        message: "Các trường bắt buộc không được để trống",
      });
    }
    const newEvent = await EventService.createEvent(req.body);

    return res.status(201).json({
      status: "OK",
      message: "Event created successfully",
      data: newEvent,
    });
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
      return res.status(200).json({
        status: "ERR",
        message: "The userId is required",
      });
    }

    const responseFromService = await EventService.updateEvent(eventId, data);
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
      return res.status(200).json({
        status: "ERR",
        message: "The eventId is required",
      });
    }

    const responseFromService = await EventService.deleteEvent(eventId);
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
    limit = 8,
    sortField = "title",
    sortOrder = "asc",
    filterField,
    filterValue,
  } = req.query;

  try {
    const result = await EventService.getAllEvent(
      limit,
      page,
      sortField,
      sortOrder,
      filterField,
      filterValue
    );
    return res.json(result);
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

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvent,
  getDetailEvent,
};
