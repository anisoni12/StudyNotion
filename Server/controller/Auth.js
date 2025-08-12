const User = require("../models/User");
// const bcrypt = require("bcryptjs")
const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");
const mailSender = require("../utils/mailSender")
require("dotenv").config();

//sendOTP
exports.sendOTP = async (req, res) => {

     try{
        
         // here we fetched the email from the body

        const { email } = req.body;

        //check if the user exist or not 
        const checkUserPresent = await User.findOne({ email });
    
        //if user exists than return a response 
        if(checkUserPresent) {
            return res.status(401).json({
                success: false,
                message:"User already registered",
            });
        }
    
        //generate OTP
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generated: " , otp);

        //check unique otp or not 

        const result = await OTP.findOne({otp : otp});

        while(result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp : otp});
        }

        const otpPayload = {email, otp};

        //create an entry for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        //returned the response successfully 
        res.status(200).json({
            success:true,
            message:'OTP Sent Successfully',
            otp,
        })  
    }
        catch(error) {
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message,
            })
        }
    }



//SignUp
exports.signUp = async (req , res) => {

    try{

         // data fetch from the request body
            const {
                firstName,
                lastName,
                email,
                password,
                confirmPassword,
                accountType,
                contactNumber,
                otp
            } = req.body;

         // validate krlo

            if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
                return res.status(403).json({
                    success:false,
                    message:'All fields required',
                })
            }

        // match both the passwords
            if(password !== confirmPassword){
                return res.status(400).json({
                    success:false,
                    message:'Password and confirmPassword does not match',
                });
            }

        // check if user already exists or not

            const existingUser = await User.findOne({email});
            if(existingUser) {
                return res.status(400).json({
                    success:false,
                    message:'User already exists , Please Login'
                });
            }

        // find most recent OTP for the user

            const recentOtp = await OTP.findOne({email}).sort({createdAt:-1}).limit(1); 
            console.log(recentOtp);

        // validate the otp    

            if(!recentOtp || recentOtp.length === 0){
                //This means that we could not find the OTP
                return res.status(400).json({
                    success:false,
                    message:'OTP not found',
                })
            } else if(otp !== recentOtp.otp) {
                //Invalid Otp
                return res.status(400).json({
                    success:false,
                    message:'Invalid OTP',
                }); 
            }
            
        // Hash the password 

            const hashedPassword = await bcrypt.hash(password, 10);

        // create entry in DB

            const profileDetails = await Profile.create({
                gender:null,
                dateOfBirth:null,
                about:null,
                contactNumber:null
            });

            const user = await User.create({
                firstName,
                lastName,
                email,
                contactNumber,
                password:hashedPassword,
                accountType,
                additionalDetails:profileDetails._id,
                image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName} ` ,
            })

        // return response
        return res.status(200).json({
            success:true,
            message:'User is registered Successfully',
            user,
        });
    }

    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'User cannot be registered. Please try again !',
        })
    }
}


//Login

exports.login = async (req , res) => {
    try{
        //get data from req body
        const {email , password } = req.body;

        // validation data
        if(!email || !password){
            return res.status(403).json({
                success:false,
                message:'All fields are required, please try again',
            });
        }

        // does user exist or not 
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user) {
            return res.status(401).json({
                success:false,
                message:'User is not registered, please signup first ',
            });
        }

        // generate JWT, only if password is matched 
        if(await bcrypt.compare(password, user.password)){
                const payload = {
                    email: user.email,
                    id: user._id,
                    accountType: user.accountType,
                }
            const token = jwt.sign(payload , process.env.JWT_SECRET , {
                expiresIn:"2h",
            });
            // user.token = token;
            user.password= undefined;

            // create cookie and send response
            const options = {   
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token", token , options).status(200).json({
                success:true,
                token,
                user,
                message:"Logged in successfully",
            })

        }
        else {
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            });
        }

    }

    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login failure, Please try again.",
        });
    }
};



// ChangePassword

exports.changePassword = async (req, res) => {
    try {
      // Get user data from req.user
      const userDetails = await User.findById(req.user.id)
  
      // Get old password, new password, and confirm new password from req.body
      const { oldPassword, newPassword } = req.body
  
      // Validate old password
      const isPasswordMatch = await bcrypt.compare(
        oldPassword,
        userDetails.password
      )
      if (!isPasswordMatch) {
        // If old password does not match, return a 401 (Unauthorized) error
        return res
          .status(401)
          .json({ success: false, message: "The password is incorrect" })
      }
  
      // Update password
      const encryptedPassword = await bcrypt.hash(newPassword, 10)
      const updatedUserDetails = await User.findByIdAndUpdate(
        req.user.id,
        { password: encryptedPassword },
        { new: true }
      )
  
      // Send notification email
      try {
        const emailResponse = await mailSender(
          updatedUserDetails.email,
          "Password for your account has been updated",
          passwordUpdated(
            updatedUserDetails.email,
            `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
          )
        )
        console.log("Email sent successfully:", emailResponse.response)
      } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error)
        return res.status(500).json({
          success: false,
          message: "Error occurred while sending email",
          error: error.message,
        })
      }
  
      // Return success response
      return res
        .status(200)
        .json({ success: true, message: "Password updated successfully" })
    } catch (error) {
      // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while updating password:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while updating password",
        error: error.message,
      })
    }
  }