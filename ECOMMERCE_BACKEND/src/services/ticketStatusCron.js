const cron = require("node-cron");
const Ticket = require("../models/TicketModel");

// Chạy mỗi phút
cron.schedule("* * * * *", async () => {
  const now = new Date();

  try {
    const tickets = await Ticket.find();

    for (const t of tickets) {
      const sold = t.sold || 0;
      const total = t.quantity || 0;
      const remain = total - sold;

      let newStatus = t.trangThai;

      // 1️⃣ Vé hết hạn theo endDate
      if (t.endDate && now > t.endDate) {
        newStatus = "HetHan";
      }
      // 2️⃣ Vé đã bán hết
      else if (remain <= 0) {
        newStatus = "HetVe";
      }
      // 3️⃣ Vé sắp bán hết
      else if (remain <= 5) {
        newStatus = "SapBan";
      }
      // 4️⃣ Vé còn vé
      else {
        newStatus = "ConVe";
      }

      // Nếu trạng thái thay đổi → update DB
      if (newStatus !== t.trangThai) {
        await Ticket.updateOne(
          { _id: t._id },
          { $set: { trangThai: newStatus } }
        );

        // Realtime Socket.io nếu dùng
        global._io?.emit("ticket-status-changed", {
          ticketId: t._id,
          newStatus,
        });
      }
    }

    console.log("✓ Cron updated all ticket statuses");
  } catch (err) {
    console.error("Ticket Cron Error:", err);
  }
});
