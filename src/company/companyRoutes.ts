import express from "express";
import { createCompany } from "./companyController";

const companyRoutes = express.Router();

companyRoutes.post("/", createCompany);

export default companyRoutes;
