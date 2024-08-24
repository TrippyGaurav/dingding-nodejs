import crypto from 'crypto';

// Generate a 6-digit OTP
export const generateOTP = (): string => {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
};

export const sendOTP = async (to: string, otp: string): Promise<void> => {
    try {
        console.log(`Sending OTP ${otp} to ${to}`);
    } catch (error) {
        throw new Error('Failed to send OTP');
    }
};
