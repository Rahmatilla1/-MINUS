const Users = require("../model/userModel");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const util = require("util"); // 🔧 BU YANGI QATOR
const { v4 } = require("uuid");
const bcrypt = require("bcrypt");

const uploadsDir = path.join(__dirname, "../", "public");

// 📁 Agar 'public' papka mavjud bo'lmasa, uni yaratamiz
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const userCtrl = {
  getAll: async (req, res) => {
    try {
      let users = await Users.find();

      users = users.map((user) => {
        const { password, role, ...otherDetails } = user._doc;
        return otherDetails;
      });

      res.status(200).json({ message: "All users", users });
    } catch (error) {
      res.status(503).json(error.message);
    }
  },
  getOne: async (req, res) => {
    const { userId } = req.params;
    try {
      let users = await Users.findById(userId);

      if (!users) {
        return res.status(404).json({ message: "Not found" });
      }

      const { password, ...otherDetails } = users._doc;

      res.status(200).json({ message: "User info", user: otherDetails });
    } catch (error) {
      res.status(503).json({ message: error.message });
    }
  },

deleteUser: async (req, res) => {
  const { userId } = req.params;
  try {
    if (userId === req.user._id || req.userIsAdmin) {
      const deletedUser = await Users.findByIdAndDelete(userId);

      if (deletedUser) {
        try {
          if (deletedUser.profilePicture) {
            await fsPromises.unlink(
              path.join(uploadsDir, deletedUser.profilePicture)
            );
          }
          if (deletedUser.coverPicture) {
            await fsPromises.unlink(
              path.join(uploadsDir, deletedUser.coverPicture)
            );
          }
        } catch (err) {
          console.error("File delete error:", err.message);
          // Lekin response jo'natilmaydi bu yerda!
        }

        return res
          .status(200)
          .json({ message: "Successfully deleted", user: deletedUser });
      } else {
        return res.status(404).json({ message: "Not found" });
      }
    }

    return res.status(405).json({
      message: "Access Denied! Only you can delete your account",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(503).json({ message: error.message });
  }
},

updateUser: async (req, res) => {
  try {
    const { password } = req.body;
    const { userId } = req.params;
    const user = await Users.findById(userId);

    if (!(userId == req.user._id || req.userIsAdmin)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 🔐 Parolni yangilash
    if (password && password !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      req.body.password = hashedPassword;
    } else {
      delete req.body.password;
    }

    // 📸 Rasmlar bilan ishlash
    const handleImage = async (fieldName, oldFileName) => {
      const file = req.files[fieldName];
      const format = file.mimetype.split("/")[1];

      if (!["png", "jpg", "jpeg"].includes(format)) {
        throw new Error(`${fieldName} format is incorrect`);
      }

      const newFileName = `${v4()}.${format}`;
      const uploadPath = path.join(uploadsDir, newFileName);

      // mv() promisify orqali
      const mvAsync = util.promisify(file.mv.bind(file));
      await mvAsync(uploadPath);

      req.body[fieldName] = newFileName;

      // Eski faylni o‘chirish
      const oldPath = path.join(uploadsDir, oldFileName);
      if (oldFileName && fs.existsSync(oldPath)) {
        await fsPromises.unlink(oldPath);
      }
    };

    if (req.files) {
      if (req.files.profilePicture) {
        await handleImage("profilePicture", user.profilePicture);
      }

      if (req.files.coverPicture) {
        await handleImage("coverPicture", user.coverPicture);
      }
    }

    // 📝 Ma'lumotlarni yangilash
    const updatedUser = await Users.findByIdAndUpdate(userId, req.body, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Not found" });
    }

    return res
      .status(200)
      .json({ message: "Updated successfully", user: updatedUser });

  } catch (error) {
    console.error("Update error:", error.message);
    return res.status(503).json({ message: error.message });
  }
}
};

module.exports = userCtrl;