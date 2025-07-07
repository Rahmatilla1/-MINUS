const Message = require("../model/messageModel");
const { v4 } = require("uuid");
const mongoose = require("mongoose")
const fs = require("fs/promises");
const path = require("path");
const User = require("../model/userModel")
const uploadsDir = path.join(__dirname, "../", "public");
const { notifyUser } = require("../controller/pushCtrl");

const messageCtrl = {

addMessage: async (req, res) => {
  const { chatId, senderId, text } = req.body;

  try {
    // 1️⃣ Bo‘sh kelishlarni tekshirish
    if (!chatId || !senderId) {
      return res.status(400).json({ message: "chatId yoki senderId kerak" });
    }

    // 2️⃣ Userni topamiz
    const senderUser = await User.findById(senderId);
    if (!senderUser) {
      return res.status(404).json({ message: "Sender topilmadi" });
    }

    // 3️⃣ Fayl bo‘lsa, yuklaymiz
    if (req.files && req.files.file) {
      const { file } = req.files;
      const format = file.mimetype.split("/")[1];
      const fileType = file.mimetype.split("/")[0]; // ← image/audio/video

      const allowedFormats = ["png", "jpg", "jpeg", "webm", "mp3", "wav", "ogg", "mp4"];
      if (!allowedFormats.includes(format)) {
        return res.status(403).json({ message: "Format noto‘g‘ri" });
      }

      const fileName = `${v4()}.${format}`;
      await file.mv(path.join(uploadsDir, fileName));

      req.body.file = fileName;
      req.body.type = fileType; // 🆕 video/audio/image
    }

    // 4️⃣ Fayl ham yo‘q, text ham yo‘q bo‘lsa xato
    if (!req.body.file && (!text || text.trim() === "")) {
      return res.status(400).json({ message: "Xabar matni yoki fayl bo‘lishi kerak" });
    }

    // 5️⃣ Endi message objectni yaratamiz
    const message = new Message(req.body);
    await message.save();

    // 6️⃣ Push notification
    await notifyUser({
      body: `${senderUser.firstName} sizga xabar yubordi`,
    });

    return res.status(201).json({ message: "✅ Yangi xabar qo‘shildi", message });

  } catch (error) {
    console.error("Server xatosi:", error.message);
    return res.status(500).json({ message: error.message });
  }
},

  getMessages: async (req, res) => {
    const { chatId } = req.params;
    try {
      const messages = await Message.find({ chatId });
      res.status(200).json({ message: "Chat's message", messages });
    } catch (error) {
      console.log(error);
      res.status(503).json({ message: error.message });
    }
  },

deleteMessage: async (req, res) => {
  const { messageId } = req.params;

  // ✅ ID validatsiyasi
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "❌ Noto‘g‘ri message ID" });
  }

  try {
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    if (deletedMessage) {
      // Agar fayl bor bo‘lsa — uni o‘chiramiz
      if (deletedMessage.file) {
        try {
          await fs.unlink(path.join(uploadsDir, deletedMessage.file));
        } catch (err) {
          // Faqat log qilamiz, lekin javob yubormaymiz!
          console.log("Faylni o‘chirishda xato:", err.message);
        }
      }

      return res
        .status(200)
        .json({ message: "✅ Xabar o‘chirildi", deletedMessage });
    }

    return res.status(404).json({ message: "❌ Xabar topilmadi" });
  } catch (error) {
    console.log(error);
    return res.status(503).json({ message: error.message });
  }
},
updateMessage: async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Xabar topilmadi" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Ruxsat yo‘q" });
    }

    if (req.files && req.files.file) {
      const { file } = req.files;
      const format = file.mimetype.split("/")[1];
      const fileType = file.mimetype.split("/")[0];

      const allowedFormats = ["png", "jpg", "jpeg", "webm", "mp3", "wav", "ogg", "mp4"];
      if (!allowedFormats.includes(format)) {
        return res.status(403).json({ message: "Format noto‘g‘ri" });
      }

      const name = `${v4()}.${format}`;
      await file.mv(path.join(uploadsDir, name));

      req.body.file = name;
      req.body.type = fileType;

      // Eski faylni o‘chirish
      if (message.file) {
        try {
          await fs.unlink(path.join(uploadsDir, message.file));
        } catch (err) {
          console.log("Eski fayl o‘chirishda xato:", err.message);
        }
      }
    }

    const updatedMessage = await Message.findByIdAndUpdate(messageId, req.body, { new: true });
    res.status(200).json({ message: "Updated succesfully", updatedMessage });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},


};

module.exports = messageCtrl;