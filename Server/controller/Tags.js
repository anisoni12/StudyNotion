
const Tags = require("../models/tags");

//create handler function of tag

exports.createTag = async (req , res) => {
    try{
        //fetch data 
            const {name , description} = req.body;

        //check the data for validation
            if(!name || !description){
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required', 
                })
            }
        
        //create entry in DB
            const tagDetails = await Tags.create({
                name: name,
                description: description,
            });
            console.log(tagDetails);

        //return response
            return res.status(200).json({
                success: true,
                message: "Tag Created Successfully",
            })
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};

//getAlltags handler function

exports.showAlltags = async (req , res) => {
    try{    
        const allTags = await Tags.find({}, {name:true , description:true});
        res.status(200).json({
            success:true,
            message:'All Tags returned successfully',
            allTags,
        })
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}