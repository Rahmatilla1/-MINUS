const express = require("express");
const router = express.Router();

const userCtrl = require("../controller/userCtrl");
const authMiddlewear = require("../middleware/authMiddlaware");

router.get("/", userCtrl.getAll);
router.get("/:userId", userCtrl.getOne);
router.put("/:userId", authMiddlewear, userCtrl.updateUser);
router.delete("/:userId", authMiddlewear, userCtrl.deleteUser);

module.exports = router;