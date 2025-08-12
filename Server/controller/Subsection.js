const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// create Subsection

exports.createSubSection = async (req , res) => {
    try {
        //fetch data from req body
        const {sectionId , title , timeDuration , description} = req.body; 
        // extract file/video
        const video = req.files.videoFile ;
        //validation
        if(!sectionId || !title || !timeDuration || !description || !video ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        console.log(video);
        //update video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video , process.env.FOLDER_NAME);
        console.log(uploadDetails);

        //create a subsection
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url, 
        })
        //update section with this subsection
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                    {$push:{
                                                        subSection: SubSectionDetails._id,
                                                    }},
                                                    {new: true}
                                                ).populate("subSection"); 
                                
        //HW: log updated section here , after adding populate query
        // return response 
        return res.status(200).json({
            success: true,
            message: "Sub Section Created Successfully",
            data: updatedSection,
        });
    } 
    
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            error: error.message,
        })
    }
};


//HW: updateSubSection 

exports.updateSubSection = async (req , res) => {
    try{
        const {subSectionId , title , timeDuration , description} = req.body;
        
        if(!subSectionId ){
            return res.status(400).json({
                success: false,
                message: "Subsection Id is required",
            });
        }
        const updatedSubSection = await SubSection.findByIdAndUpdate( subSectionId,
                                            {title , timeDuration , description},
                                            { new : true }
                                        );

        if(!updatedSubSection){
            return res.status(400).json({
                success: false,
                message: "Subsection not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "SubSection updated successfully",
            updatedSubSection,
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

//HW: deleteSubSection
exports.deleteSubSection = async (req , res) => {
    try{
        // fetch data
        const {subSectionId , sectionId} = req.body;
        // validate data 
        if(!subSectionId || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "SubSection ID and Section ID are required",
            });
        }

        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        if(!deletedSubSection) {
            return res.status(404).json({
                success: false,
                message: "Subsection not found ",
            });
        }
        await Section.findByIdAndUpdate(sectionId , {
                                $pull: {subSection: subSectionId},
        });

        return res.status(200).json({
            success: true,
            messgae: " Subsection deleted Successfully",
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: "Internal server Error",
            error: error.message,
        });
    }
};