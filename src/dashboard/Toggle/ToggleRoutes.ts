//routes for toggle

import express from "express";
import { ToggleController } from "./ToggleController";

const toggleController = new ToggleController();
export const toggleRoutes = express.Router();
toggleRoutes.put("/", toggleController.putToggle);

export default toggleRoutes;
