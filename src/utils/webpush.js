const webpush = require("web-push");

const publicVapidKey = "BD5ekKbZpFMXQzeUgwYJ1WL95Y9mZLTODnfIinOlDaKmHvaaBFA6wg7biqIUwj4oezXtIPmHvPoSilkKuaZtM1o";
const privateVapidKey = "tiB--pxBENJy5pl3AJVihaWTCvJFPJasBmWq-3fYBNE";

webpush.setVapidDetails(
  "mailto:you@example.com",
  publicVapidKey,
  privateVapidKey
);

module.exports = webpush;