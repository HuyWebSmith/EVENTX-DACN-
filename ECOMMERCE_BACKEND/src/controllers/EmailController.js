const QRCode = require("qrcode");
const IssuedTicket = require("../models/IssuedTicket");
const Ticket = require("../models/TicketModel");
const Order = require("../models/OrderProduct");
const OrderDetail = require("../models/OrderDetail");
const sendEmailService = require("../services/EmailService");

const sendMailForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ status: "ERR", message: "Order không tồn tại" });
    }

    const orderDetails = await OrderDetail.find({ orderId })
      .populate("orderId")
      .populate("ticketId");
    console.log(orderDetails);

    if (orderDetails.length === 0) {
      return res
        .status(400)
        .json({ status: "ERR", message: "Không có OrderDetail" });
    }

    const issuedTickets = await IssuedTicket.find({
      orderDetailId: { $in: orderDetails.map((d) => d._id) },
    });

    let ticketsHtml = "";
    let attachments = []; // ⭐ Đính kèm QR code

    for (const ticket of issuedTickets) {
      const od = orderDetails.find(
        (d) => d._id.toString() === ticket.orderDetailId.toString()
      );

      const ticketInfo = await Ticket.findById(od.ticketId);

      // Tạo QR base64
      const qrBase64 = await QRCode.toDataURL(ticket.ticketCode);
      const qrImage = qrBase64.split(",")[1]; // Bỏ header base64

      const cid = `qr_${ticket.ticketCode}@eventx`;

      // Đính kèm file QR
      attachments.push({
        filename: `${ticket.ticketCode}.png`,
        content: Buffer.from(qrImage, "base64"),
        cid: cid,
      });

      // HTML hiển thị QR dựa trên CID
      ticketsHtml += `
        <tr>
          <td>${ticketInfo.type}</td>
          <td style="text-align:center">
            <img src="cid:${cid}" width="130" height="130"/>
            <div style="font-size: 12px; color: #555">${ticket.ticketCode}</div>
          </td>
          <td>${od.price.toLocaleString()} VND</td>
        </tr>
      `;
    }

    const htmlContent = `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 0; margin: 0;">
    
    <!-- Header -->
    <div style="
      background: linear-gradient(90deg, #4f46e5, #6d28d9);
      padding: 20px;
      text-align: center;
      color: white;
      border-radius: 6px 6px 0 0;
    ">
      <h1 style="margin: 0; font-size: 26px;">EventX - Vé Sự Kiện Của Bạn</h1>
    </div>

    <div style="padding: 20px;">
      <h2 style="color: #111; margin-top: 0;">Xin chào ${order.fullName},</h2>

      <p>Cảm ơn bạn đã đặt vé tại <strong>EventX</strong>.</p>

      <!-- Order Info Card -->
      <div style="
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 25px;
      ">
        <h3 style="margin-top: 0; color: #1e293b;">🧾 Thông tin đơn hàng</h3>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Tổng tiền:</strong> 
          <span style="color:#16a34a; font-weight:bold;">
            ${order.totalAmount.toLocaleString()} VND
          </span>
        </p>
      </div>

      <!-- Ticket Section -->
      <h3 style="color: #1e293b;">🎟 Vé của bạn</h3>

      <table cellpadding="0" cellspacing="0" width="100%" style="
        border-collapse: collapse;
        margin-top: 10px;
      ">
        <tr style="background: #e2e8f0;">
          <th style="padding: 12px; border: 1px solid #cbd5e1; text-align:left;">Tên vé</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1;">QR Code</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1;">Giá</th>
        </tr>

        ${ticketsHtml}
      </table>

      <div style="margin-top: 30px; padding: 15px; background: #fefce8; border-left: 4px solid #facc15;">
        <p style="margin: 0;">
          ⚠️ <strong>Lưu ý:</strong> Vui lòng dùng QR Code để check-in tại sự kiện.
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 14px;">
        <p>Cảm ơn bạn đã sử dụng EventX ❤️</p>
      </div>
    </div>
    
  </div>
`;

    await sendEmailService({
      to: order.email,
      subject: "🎟 Vé sự kiện của bạn (QR Code)",
      html: htmlContent,
      attachments,
    });
    order.isEmailSent = true;
    await order.save();

    return res.status(200).json({
      status: "OK",
      message: "Gửi email thành công",
    });
  } catch (e) {
    console.log("email error:", e);
    return res
      .status(500)
      .json({ status: "ERR", message: "Gửi email thất bại" });
  }
};

module.exports = { sendMailForOrder };
