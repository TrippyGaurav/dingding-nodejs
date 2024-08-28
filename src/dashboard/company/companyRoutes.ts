import express from "express";
import { CompanyController } from '../company/companyController'
// import { createCompany } from "./companyController";
const companyRoutes = express.Router();
const company = new CompanyController();

// companyRoutes.post("/", createCompany);
companyRoutes.post('/request-otp', company.requestOTP)
companyRoutes.post('/verify-otp', company.verifyOTPAndCreateUser)
export default companyRoutes;
