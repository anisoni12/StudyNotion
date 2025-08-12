const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date, 
        default: Date.now(),
        expires: 5*60,
    }
});

// a function -> to send emails
async function sendVerificationEmails(email , otp) {
    try{
        const mailResponse = await mailSender(
                email , 
                "Verification Email from StudyNotion",
                emailTemplate(otp)
            );

        console.log("Email sent Successfully: " , mailResponse); 
    }

    catch(error) {
        console.log("Error occured while sending mails" , error);
        throw error ;
    }
}

otpSchema.pre("save" , async function(next) {
    console.log("New Document saved to Database");

    if(this.isNew){
    await sendVerificationEmails(this.email, this.otp);
    }
    next();
});

module.exports = mongoose.model("OTP" , otpSchema);

