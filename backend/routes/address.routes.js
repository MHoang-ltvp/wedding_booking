const express = require("express");
const addressController = require("../controllers/address.controller");

const router = express.Router();

router.get("/provinces", addressController.listProvinces);
router.get("/provinces/:provinceCode/districts", addressController.listDistrictsByProvince);
router.get("/districts/:districtCode/wards", addressController.listWardsByDistrict);

module.exports = router;
