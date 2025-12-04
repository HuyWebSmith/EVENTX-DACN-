const cron = require("node-cron");
const Event = require("../models/EventModel");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  try {
    // 1️⃣ APPROVED → ONGOING (đang diễn ra)
    const toOngoing = await Event.find({
      status: "Approved",
      eventStartTime: { $lte: now },
      eventEndTime: { $gte: now },
    }).select("_id");

    if (toOngoing.length > 0) {
      await Event.updateMany(
        { _id: { $in: toOngoing.map((e) => e._id) } },
        { $set: { status: "Ongoing" } }
      );

      global._io?.emit("event-status-changed", {
        ids: toOngoing.map((e) => e._id),
        newStatus: "Ongoing",
      });
    }

    // 2️⃣ APPROVED → FINISHED (kết thúc mà chưa chạy hoặc kết thúc rồi)
    const approvedToFinished = await Event.find({
      status: "Approved",
      eventEndTime: { $lt: now },
    }).select("_id");

    if (approvedToFinished.length > 0) {
      await Event.updateMany(
        { _id: { $in: approvedToFinished.map((e) => e._id) } },
        { $set: { status: "Finished" } }
      );

      global._io?.emit("event-status-changed", {
        ids: approvedToFinished.map((e) => e._id),
        newStatus: "Finished",
      });
    }

    // 3️⃣ ONGOING → FINISHED
    const ongoingToFinished = await Event.find({
      status: "Ongoing",
      eventEndTime: { $lt: now },
    }).select("_id");

    if (ongoingToFinished.length > 0) {
      await Event.updateMany(
        { _id: { $in: ongoingToFinished.map((e) => e._id) } },
        { $set: { status: "Finished" } }
      );

      global._io?.emit("event-status-changed", {
        ids: ongoingToFinished.map((e) => e._id),
        newStatus: "Finished",
      });
    }

    console.log("✓ Cron fully updated all event statuses");
  } catch (err) {
    console.error("Cron error:", err);
  }
});
