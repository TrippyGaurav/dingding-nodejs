import express from "express";
import payoutController from "./payoutController";
import multer from "multer";

const payoutRoutes = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Create a new payout
payoutRoutes.post("/", upload.fields([{ name: "payoutFile" }]), payoutController.uploadNewVersion);


// Get all payouts
// Get a single payout by ID
// Update  a payout by ID
// Delete a payout by ID
payoutRoutes.delete("/:tagName/:version", payoutController.deletePayout);

export default payoutRoutes