const router = require("express").Router();
const { subscribe } = require("../controller/pushCtrl");

router.post("/subscribe", subscribe);

module.exports = router;
