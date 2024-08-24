import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { generateOTP, sendOTP } from './otpUtils';
import { config } from '../../config/config';

export class OTPController {
    private currentOTP: { otp: string; expiresAt: Date } | null = null;

    async requestOTP(req: Request, res: Response, next: NextFunction) {
        const mobileNumber = config.phonenumber;
        if (!mobileNumber) {
            throw createHttpError(500, 'Mobile number is not configured');
        }

        const otp = generateOTP();

        // Store OTP with an expiration time
        this.currentOTP = { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };

        try {
            // Send OTP
            await sendOTP(mobileNumber, otp);
            res.status(200).json({ message: 'OTP sent' });
        } catch (error) {
            next(createHttpError(500, 'Failed to send OTP'));
        }
    }

    async verifyOTP(req: Request, res: Response, next: NextFunction) {
        const { otp }: { otp: string } = req.body;
        if (!otp) {
            throw createHttpError(400, 'OTP is required');
        }

        if (!this.currentOTP || new Date() > this.currentOTP.expiresAt) {
            throw createHttpError(400, 'OTP has expired or is invalid');
        }

        if (this.currentOTP.otp !== otp) {
            throw createHttpError(400, 'Invalid OTP');
        }

        // OTP is valid
        this.currentOTP = null; // Clean up OTP
        res.status(200).json({ message: 'OTP verified' });
    }
}
