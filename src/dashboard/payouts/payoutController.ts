import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import Payouts from "./payoutModel";
import path from "path";
import { Platform } from "../games/gameModel";


interface GameRequest extends Request {
    files?: {
        [fieldname: string]: Express.Multer.File[];
    };
}

class PayoutsController {
    constructor() {

    }

    async uploadNewVersion(req: GameRequest, res: Response, next: NextFunction) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { tagName, platform: platformName } = req.body;
            const files = req.files.payoutFile;

            if (!files || files.length === 0) {
                throw createHttpError(400, "No files uploaded")
            }

            const payoutFile = files[0];
            const payoutJSONData = JSON.parse(payoutFile.buffer.toString("utf-8"));
            let payoutFileName = path.parse(payoutFile.originalname).name;

            const payout = await Payouts.findOne({ gameName: tagName });

            if (!payout) {
                throw createHttpError(404, "Resource not found")
            }

            const existingCount = await Payouts.aggregate([
                { $match: { gameName: tagName } },
                { $unwind: "$content" },
                { $match: { "content.name": { $regex: `^${payoutFileName}(-\\d+)?$` } } },
                { $count: "count" }
            ]);

            if (existingCount.length > 0 && existingCount[0].count > 0) {
                payoutFileName += `-${existingCount[0].count}`;
            }

            const contentId = new mongoose.Types.ObjectId();

            await Payouts.updateOne(
                { gameName: tagName },
                { $push: { content: { _id: contentId, name: payoutFileName, data: payoutJSONData } } },
                { session }
            )


            const platform = await Platform.findOneAndUpdate(
                { name: platformName, "games.tagName": tagName },
                { $set: { "games.$.payout": contentId } },
                { new: true, session }
            );

            if (!platform) {
                throw createHttpError(404, "Platform or game not found");
            }

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({ message: "New Version Added" })
        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            console.log(error);
            next(error)
        }
    }

    async setCurrentPayout(req: GameRequest, res: Response, next: NextFunction) {
        try {
            const { version, tagName, platform: platformName } = req.body;

            const gamePayouts = await Payouts.findOne({ gameName: tagName });

            if (!gamePayouts) {
                throw createHttpError(404, "Payout not found");
            }

            const payout = gamePayouts.content.find(item => item.name === version);
            if (!payout) {
                throw createHttpError(404, "Version not found")
            }


            const platform = await Platform.findOneAndUpdate(
                { name: platformName, "games.tagName": tagName },
                { $set: { "games.$.payout": payout._id } },
                { new: true }
            )

            if (!platform) {
                throw createHttpError(404, "Platform or game not found");
            }

            res.status(200).json({ message: "Current payout version set successfully" });

        } catch (error) {
            console.error(error);
            next(error);
        }
    }


    async deletePayout(req: GameRequest, res: Response, next: NextFunction) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { tagName, version } = req.params;

            // Find the document and check the content array length
            const payoutDoc = await Payouts.findOne({ gameName: tagName });

            if (!payoutDoc) {
                throw createHttpError(404, "Game not found");
            }

            const contentCount = payoutDoc.content.length;

            if (contentCount <= 1) {
                throw createHttpError(400, "Cannot delete the only remaining content");
            }

            // Check if the version exists in the content array and get the version ID
            const versionExists = payoutDoc.content.find(content => content.name === version);

            if (!versionExists) {
                throw createHttpError(404, "Version not found");
            }

            // Check if any game in the Platform collection is using this payout version
            const gameUsingPayout = await Platform.findOne({
                name: "milkyway",
                "games.tagName": tagName,
                "games.payout": versionExists._id
            }).session(session);

            if (gameUsingPayout) {
                throw createHttpError(400, "Cannot delete the version as it is currently in use");
            }

            // Perform the update operation
            await Payouts.findOneAndUpdate(
                { gameName: tagName },
                { $pull: { content: { name: version } } },
                { new: true, session }
            );

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({ message: "Payout Version deleted successfully" });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();

            console.log(error);
            next(error);
        }
    }
}

export default new PayoutsController()