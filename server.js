const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const dotenv = require("dotenv");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
dotenv.config();

// Routerlar
const authRouter = require("./src/router/authRouter");
const userRouter = require("./src/router/userRouter");
const chatRouter = require("./src/router/chatRouter");
const messageRouter = require("./src/router/messageRouter");
const pushRouter = require("./src/router/pushRouter");

const app = express();
const PORT = process.env.PORT || 4002;

// HTTP va Socket.io server
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST", "DELETE", "PUT"],
  },
});

// Statik fayllar (rasm, audio, video)
app.use(express.static(path.join(__dirname, "src", "public")));

// Middlewares
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routerlar
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/push", pushRouter);

// ✅ WebSocket: foydalanuvchilar va xabarlar
let activeUsers = [];

io.on("connection", (socket) => {
  // 🔔 Yangi foydalanuvchi qo‘shilishi
  socket.on("new-user-added", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
    }
    io.emit("get-users", activeUsers);
  });

  // ❌ Foydalanuvchi socketdan chiqsa
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", activeUsers);
  });

  // 🚪 Tizimdan chiqqan foydalanuvchi (exit bosgan)
  socket.on("exit", (userId) => {
    activeUsers = activeUsers.filter((user) => user.userId !== userId);
    io.emit("get-users", activeUsers);
  });

  // 📤 Xabar yuborish (text, audio, video, delete, update — hammasi shu orqali)
  socket.on("send-message", (data) => {
    const { receivedId } = data;
    const user = activeUsers.find((user) => user.userId === receivedId);
    if (user) {
      io.to(user.socketId).emit("answer-message", data);
    }
  });
});

// MongoDB ulanishi
const MONGO_URL = process.env.MONGO_URL;
mongoose
  .connect(MONGO_URL)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server ${PORT} portda ishga tushdi`);
    });
  })
  .catch((error) => console.log("❌ Mongo ulanishda xatolik:", error));