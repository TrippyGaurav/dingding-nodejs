
import { Request, Response, NextFunction } from 'express';
import Toggle from '../Toggle/ToggleModel';
import { AuthRequest } from '../../utils/utils';
import { User } from '../users/userModel';

export const checkToggle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const toggle = await Toggle.findOne();

    const _req = req as AuthRequest;

    //NOTE: checking if company user
    if (_req.route.path === '/login') {
      const companyUser = await User.findOne();

      if (_req.body.username === companyUser?.username) {
        //NOTE: is company user so proceed
        next()
      }
    } else {
      if (_req.user.role === "company") {
        //NOTE: is company user so proceed
        next()
      }
    }


    if (toggle?.availableAt) {
      const now = new Date();
      const availableAt = new Date(toggle.availableAt);

      // Check if the current time is before the 'availableAt' time
      if (now < availableAt) {
        return res.status(503).json({ message: `Under Maintenance until ${availableAt}` });
      }

      // If the time has passed, reset 'availableAt' to null
      toggle.availableAt = null;
      await toggle.save();
    }

    next(); // Proceed if the service is available
  } catch (error) {
    return res.status(500).json({ message: 'Error checking service status', error });
  }
};
