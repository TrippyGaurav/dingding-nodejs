import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../utils/utils";
import createHttpError from "http-errors";
import Toggle from "./ToggleModel";

export class ToggleController {
  constructor() {
    this.getToggle = this.getToggle.bind(this);
    this.putToggle = this.putToggle.bind(this);
  }

  //NOTE: GET toggle
  async getToggle(req: Request, res: Response, next: NextFunction) {
    try {
      const toggle = await Toggle.findOne({});
      res.status(200).json(toggle);
    } catch (error) {
      next(error);
    }
  }


  //NOTE: Add new toggle
  async putToggle(req: Request, res: Response, next: NextFunction) {
    try {

      const _req = req as AuthRequest;
      const { availableAt } = _req.body;
      if (!availableAt) throw createHttpError(404, "availableAt is required");
      if(availableAt === "null") {
        const toggle = await Toggle.findOneAndUpdate(
          {},
          { availableAt: null },
          { new: true, upsert: true }
        );
        res.status(200).json(toggle);
        return
      }
      const now = new Date();
      const time = new Date(availableAt);
      if (time < now) throw createHttpError(404, "availableAt is invalid");
      const toggle = await Toggle.findOneAndUpdate(
        {},
        { availableAt },
        { new: true, upsert: true }
      );
      res.status(200).json({ message: "Toggle updated successfully", toggle });

    } catch (error) {
      next(error);
    }
  }
}
