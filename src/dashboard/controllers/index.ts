const companyController = require("express").Router();
import verifyToken from "../middleware/tokenAuth";
const {
  sendOtp,
  otpVerification,
  resetPassword,
} = require("../utils/company_reset_password");

companyController.post("/sendOtp", sendOtp);
companyController.post("/veryfyOtp", otpVerification);
companyController.post("/resetPassword", resetPassword);

export default companyController;
