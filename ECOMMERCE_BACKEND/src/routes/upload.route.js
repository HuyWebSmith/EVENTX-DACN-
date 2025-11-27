// upload.route.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

router.post("/", upload.single("image"), (req, res) => {
  console.log("req.file", req.file);
  try {
    return res.json({
      url: req.file.path,
      message: "Upload thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
