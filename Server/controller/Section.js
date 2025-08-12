const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req , res) => {
    try{
        //data fetch
        const {sectionName , courseId} = req.body;

        //data validation 
        if(!sectionName || !courseId){
            return res.status(400).json({
                success: false,
                message: "All the required fields are not present",
            });
        }
        //create section
        const newSection = await Section.create({sectionName});
        //update course with section ObjectID
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                            courseId,
                                            {
                                                $push:{
                                                    courseContent: newSection._id, 
                                                },
                                            },
                                            {new: true},
                                        ) .populate({
                                            path: "courseContent",      // populate sections
                                            populate: {
                                                path: "subSection",
                                            },
                                        })
                                        .exec();
        // return response  
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourseDetails,
        })
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: "Unable to create a section, please try again",
            error: error.message,
        });
    }
}   

exports.updateSection = async (req , res) => {
    try{

        //data input
        const {sectionName , sectionId} = req.body; 
        //data validation
        if(!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties",
            });
        }

        //update data 
        const section = await Section.findByIdAndUpdate(sectionId , {sectionName}, {new: true});
        //return response 
        return res.status(200).json({
            success: true,
            message: "Section Updated Successfully",
        });

    }

    catch(error) {
        return res.status(500).json({
            success: false,
            message: "Unable to create a section, please try again",
            error: error.message,
        });
    }
}

exports.deleteSection = async (req , res) => {
    try{
        //get ID  - assuming that we are sending ID in parameters  
        const {sectionId} = req.body;
        // use find by id and delete
        const deletedSection = await Section.findByIdAndDelete(sectionId); 
        //TODO(we will check while testing) : do we need to delete the entry from the course schema ??
        // return response 
        
        if(!deletedSection){
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        await Course.findByIdAndUpdate(
            deletedSection.course,
            { $pull: {courseContent: sectionId }}
        );

            return res.status(200).json({
                success: true,
                message: "Section deleted successfully",
            });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: "Unable to delete a section, please try again",
            error: error.message,
        });
    }
}

exports.updateSubsection = async (req , res) => {
    try{
        const { subSection } = req.body;
        console
    }

    catch(error){

    }
}