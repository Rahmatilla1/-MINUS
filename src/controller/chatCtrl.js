const Chat = require("../model/chatModel");
const Message = require("../model/messageModel");

const chatCtrl = {
  userChat: async (req, res) => {
    const { _id } = req.user;
    try {
      const chats = await Chat.find({ members: { $in: [_id] } });
      res.status(200).json({ message: "Users chat:", chats });
    } catch (error) {
      console.log(error);
      res.status(503).json({ message: error.message });
    }
  },
  // find chat || create chat
  findChat: async (req, res) => {
    const { firstId, secondId } = req.params;

    try {
      const chat = await Chat.findOne({
        members: { $all: [firstId, secondId] },
      });

      if (chat) {
        return res.status(200).json({ message: "Found chat", chat });
      }
      const newChat = new Chat({ members: [firstId, secondId] });
      await newChat.save();
      return res.status(201).json({ message: "Found chat", chat: newChat });
    } catch (error) {
      console.log(error);
      res.status(503).json({ message: error.message });
    }
  },
  // delete chat
  deleteChat: async (req, res) => {
    const { chatId } = req.params;
    try {
      const chat = await Chat.findById(chatId);
      if (chat) {
        (await Message.find({ chatId: chat._id })).forEach((message) => {
          if (message.file) {
            fs.unlinkSync(path.join(uploadsDir, message.file), (err) => {
              if (err) {
                return res.status(503).json({ message: err.message });
              }
            });
          }
        });
        await Message.deleteMany({ chatId: chat._id });
        await Chat.findByIdAndDelete(chat._id);
        return res.status(200).json({ message: "chat deleted successfully" });
      }
      res.status(404).json({ message: "Chat not foud" });
    } catch (error) {
      res.status(503).json({ message: error.message });
    }
  },
};

module.exports = chatCtrl;