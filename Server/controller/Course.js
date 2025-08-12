
const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");


// create course handler function
const createCourse = async (req , res) => {

    try{
                const userId = req.user.id

                //fetch data
                const {courseName, courseDescription, whatYouWillLearn, price, tag: _tag, category, instructions} = req.body;

                //get thumbnail
                const thumbnail = req.files.thumbnailImage;

                // Convert the tag and instructions from stringified Array to Array
                const { tag } = req.body;
            
                console.log("tag", tag)
                console.log("instructions", instructions)

                //validation
                if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category){
                    return res.status(400).json({
                        success: false,
                        message: "All fields are required ",
                    });
                }

                //check for instructor
        
                const instructorDetails = await User.findById(userId, {
                    accountType: "Instructor",
                });

                if(!instructorDetails){
                    return res.status(400).json({
                        success: false,
                        message: "Instructor Details not found",
                    });
                }
                  
                //check given tag is valid or not 
                const categoryDetails = await Category.findById(category);
                if(!categoryDetails){
                    return res.status(404).json({
                        success: false,
                        message: "Category Details not found",
                    });
                }


                const tagDetails = await Category.findOne({ name: tag });
                if (!tagDetails) {
                    return res.status(404).json({
                        success: false,
                        message: "Tag Details not found",
                    });
                }

                //upload image to cloudinary
                const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
                console.log(thumbnailImage);

                //create an entry for new course 
                const newCourse = await Course.create({
                courseName,
                courseDescription,
                instructor: instructorDetails._id,
                whatYouWillLearn: whatYouWillLearn,
                price,
                tag,
                category: categoryDetails._id,
                thumbnail: thumbnailImage.secure_url,
            })

            //add the new course to the user schema of Instructor
            await User.findByIdAndUpdate(
                {_id: instructorDetails._id},
                {
                    $push: {
                        courses: newCourse._id,
                    }
                },
                {new:true},
            );

            //add the course to the category schema 
            const categoryDetails2 = await Category.findByIdAndUpdate(
                { _id: category },
                {
                  $push: {
                    courses: newCourse._id,
                  },
                },
                { new: true }
              )
              console.log("HEREEEEEEEE", categoryDetails2);
            
            //return response 
            return res.status(200).json({
                success: true,
                message: "Course created successfully",
                data: newCourse,
            });
    }

    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create course, Please try later",
            error: error.message,
        })
    }
};



// get all courses handler function
const getAllCourses = async (req , res) => {
    try{
        const allCourses = await Course.find({} , {courseName:true,
                                                  price: true,
                                                  thumbnail: true,
                                                  instructor: true,
                                                  ratingAndReviews: true,
                                                  studentsEnrolled: true,})
                                                  .populate("instructor")
                                                  .exec();

        return res.status(200).json({
            success: true,
            message: "All data is fetched successfully",
            data: allCourses,
        })
    }

    catch(error){
         console.log(error);
         return res.status(500).json({
            success: false,
            message: "Unable to fetch course data, please try again",
            error:error.message,
         })
    }
};

//getCourse Details
const getAllCourseDetails = async (req , res) => {
    try{
        //get id
        const {courseId} = req.body;
        //find course details
        const courseDetails = await Course.findById(courseId)
                                    .populate(
                                        {
                                            path: "instructor",
                                            populate:{
                                                path:"additionalDetails",
                                            },
                                        }
                                    )
                                    .populate("category")
                                    // .populate("ratingAndReview")
                                    .populate({
                                        path: "courseContent",
                                        populate:{
                                            path:"subSection",
                                        },
                                    })
                                    .exec();

                //validation
                if(!courseDetails) {
                    return res.status(400).json({
                        success: false,
                        message: `Could not find the course with ${courseId} `,
                    });
                }
                //return response
                return res.status(200).json({
                    success: true,
                    message: "Course details fetched successfully",
                    data: courseDetails, 
                });
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getCourseDetails = async (req , res) => {
    try{

        const { courseId } = req.body;
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
        .populate({
            path: "instructor",
            populate: {
                path: "additionalDetails",
            },
        })
        .populate("category")
        // .populate("ratingAndReviews")
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
                // select: "-videoUrl",
            },
        })
        .exec();

        if(!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }
        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
          content.subSection.forEach((subSection) => {
            const timeDurationInSeconds = parseInt(subSection.timeDuration)
            totalDurationInSeconds += timeDurationInSeconds
          })
        })
    
        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
    
        return res.status(200).json({
          success: true,
          data: {
            courseDetails,
            totalDuration,
          },
        })
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        })
      }


}


module.exports = {
    createCourse,
    getAllCourses,
    getAllCourseDetails,  // If you want to export this, rename it to getCourseDetails or update import
};

  