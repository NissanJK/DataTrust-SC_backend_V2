const router = require("express").Router();
const multer = require("multer");
const ctrl = require("../controllers/datasetController");

const upload = multer({ dest: "uploads/" });

router.post("/upload", ctrl.upload);
router.post("/import", upload.single("file"), ctrl.importCSV);
router.get("/export", ctrl.exportCSV);
router.get("/", ctrl.getAll);

module.exports = router;
