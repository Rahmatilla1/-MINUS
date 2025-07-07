const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Users = require("../model/userModel");

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const authCtrl = {
  signUp: async (req, res) => {
    const { email } = req.body;
    try {
      const existUser = await Users.findOne({ email });
      if (existUser) {
        return res.status(400).json({ message: "This user is already exist" });
      }

      const hashdedPassword = await bcrypt.hash(req.body.password, 10);

      req.body.password = hashdedPassword;

      if (req.body.role) {
        req.body.role = Number(req.body.role);
      }

      const user = new Users(req.body);
      await user.save();

      const { password, ...otherDetails } = user._doc;

      const token = JWT.sign(otherDetails, JWT_SECRET_KEY, { expiresIn: "1h" });

      res.status(201).json({
        message: "User created successfully",
        user: otherDetails,
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(503).json({ message: error.message });
    }
  },
  signIn: async (req, res) => {
    const { email, password } = req.body;
    try {
      if (email && password) {
        const oldUser = await Users.findOne({ email });
        if (!oldUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(
          req.body.password,
          oldUser.password
        );
        if (!isPasswordCorrect) {
          return res
            .status(400)
            .json({ message: "Email or password is incorrect" });
        }

        const token = JWT.sign(
          { email: oldUser.email, _id: oldUser._id, role: oldUser.role },
          JWT_SECRET_KEY
        );

        const { password, ...otherDetails } = oldUser._doc;
        res
          .status(200)
          .json({ message: "Login successfully", user: otherDetails, token });
      } else {
        res.status(403).json({ message: "Please fill all fields" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
      console.log(error);
    }
  },
};

module.exports = authCtrl;