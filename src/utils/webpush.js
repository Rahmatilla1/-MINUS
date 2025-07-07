const webpush = require("web-push");
require("dotenv").config(); // .env fayldan o‘qish uchun

const publicVapidKey = process.env.VAPID_PUBLIC;
const privateVapidKey = process.env.VAPID_PRIVATE;

webpush.setVapidDetails(
  "mailto:you@example.com",
  publicVapidKey,
  privateVapidKey
);

module.exports = webpush;