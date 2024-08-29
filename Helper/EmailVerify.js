const speakeasy = require("speakeasy");
const sgMail = require("@sendgrid/mail");


const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);
const secret = speakeasy.generateSecret({ length: 20 });


const sendOtpToUserTemp = async (req, res,next) => {
    const token = speakeasy.totp({ secret: secret.base32, encoding: "base32", digits: 6, window: 300 });
    console.log(token);
    next();
};

const sendOtpToUser = async (req, res,next) => {
    const userEmail = req.body.email;
    const token = speakeasy.totp({ secret: secret.base32, encoding: "base32", digits: 6, window: 300 });
    sendOtpEmail(userEmail, token);
    console.log(token);
    next();
};

const resendOtpToUser = async (req, res) => {
    const userEmail = req.session.user.email;
    const token = speakeasy.totp({ secret: secret.base32, encoding: "base32", digits: 6, window: 300 });
    sendOtpEmail(userEmail, token);
    res.status(200).json({ message: "OTP resent successfully!"});
};

const sendOtpEmail = (email, otp) => {
    const msg = {
        to: email,
        from: "creativepola12@gmail.com",
        subject: "Verification Code for Your Lyrics Account",
        text: `Dear User,

        Your code is: ${otp}. Use it to create your account.

        If you didn't request this, simply ignore this message.

        Yours,
        The Lyrics Team`,
    };
    sgMail.send(msg).catch(console.error);
};


const validateOtp = (req, res, next) => {
    try {
        const { otp: userOTP } = req.body;
        const isVerified = speakeasy.totp.verify({
            secret: secret.base32,
            encoding: 'base32',
            token: userOTP,
            digits: 6,
            window: 300
        });

        if (isVerified) {
            next();
        } else {
            const errors = {
                msg: 'Invalid OTP',
                path: 'otp'
            };
            return res.status(400).json({ errors });
        }
    } catch (error) {
        console.error('Error during OTP validation:', error);
        return res.status(500).json({ msg: 'Internal server error' });
    }
};


module.exports = {
    sendOtpToUser,
    resendOtpToUser,
    validateOtp,
    sendOtpToUserTemp
};

