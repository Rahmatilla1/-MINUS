const express = require("express");
const router = express.Router();
const messageCtrl = require("../controller/messageCtrl");
const authMiddleware = require("../middleware/authMiddlaware");

// 🔽 Yo‘llar
router.post("/", messageCtrl.addMessage); // Yangi xabar qo‘shish (POST /api/message)
router.get("/:chatId", messageCtrl.getMessages); // Xabarlarni olish
router.delete("/:messageId", messageCtrl.deleteMessage); // Xabarni o‘chirish
router.put("/:messageId", authMiddleware, messageCtrl.updateMessage);

module.exports = router;