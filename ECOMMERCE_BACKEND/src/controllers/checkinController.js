const IssuedTicket = require("../models/IssuedTicket");

exports.scanTicket = async (req, res) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode)
      return res.status(400).json({
        success: false,
        message: "Thiếu ticketCode",
      });

    const issuedTicket = await IssuedTicket.findOne({ ticketCode })
      .populate({
        path: "orderDetailId",
        populate: [
          { path: "orderId", model: "Order" },
          {
            path: "ticketId",
            model: "Ticket",
            populate: { path: "eventId", model: "Event" },
          },
        ],
      })
      .populate("seatId");

    if (!issuedTicket)
      return res.json({
        success: false,
        message: "Vé không tồn tại",
        status: "Invalid",
      });

    if (issuedTicket.status === "Expired")
      return res.json({
        success: false,
        message: "Vé đã hết hạn!",
        status: "Expired",
      });

    if (issuedTicket.isCheckedIn)
      return res.json({
        success: false,
        message: "Vé này đã check-in!",
        status: "CheckedIn",
      });

    // --- CHECK-IN THÀNH CÔNG ---
    issuedTicket.isCheckedIn = true;
    issuedTicket.status = "CheckedIn";
    issuedTicket.checkinTime = new Date();
    await issuedTicket.save();

    // --- FORMAT DATA CHO FE DỄ SÀI ---
    const order = issuedTicket.orderDetailId.orderId;
    const ticket = issuedTicket.orderDetailId.ticketId;
    const event = issuedTicket.orderDetailId.ticketId.eventId;

    const responseData = {
      eventName: event?.title,
      eventDate: event?.eventDate,
      eventStartTime: event?.eventStartTime,
      eventEndTime: event?.eventEndTime,

      customerName: order?.fullName,
      customerEmail: order?.email,
      customerPhone: order?.phoneNumber,

      ticketName: ticket?.name,
      ticketPrice: ticket?.price,

      seatNumber: issuedTicket?.seatId?.seatNumber || null,

      ticketCode: issuedTicket.ticketCode,
      checkInTime: issuedTicket.checkinTime,
    };

    return res.json({
      success: true,
      message: "Check-in thành công",
      status: "CheckedIn",
      data: responseData,
    });
  } catch (error) {
    console.error("Lỗi scan ticket:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
