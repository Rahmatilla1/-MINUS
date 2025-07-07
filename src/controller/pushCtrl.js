const webpush = require("../utils/webpush");
const Subscription = require("../model/Subscription");

const subscribe = async (req, res) => {
  try {
    const sub = new Subscription(req.body);
    await sub.save();
    res.status(201).json({ message: "🔔 Push subscription saqlandi" });
  } catch (err) {
    res.status(500).json({ message: "❌ Saqlashda xatolik", error: err.message });
  }
};

const notifyUser = async ({ body }) => {
  try {
    const subscriptions = await Subscription.find();

    const notificationPayload = JSON.stringify({
      title: "🔔 Yangi xabar",
      body,
    });

    for (const sub of subscriptions) {
      await webpush.sendNotification(sub, notificationPayload).catch((err) => {
        console.log("❌ Push yuborishda xatolik:", err.message);
      });
    }
  } catch (err) {
    console.error("❌ notifyUser xatosi:", err.message);
  }
};

module.exports = { notifyUser, subscribe};