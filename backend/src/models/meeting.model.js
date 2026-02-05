import mongoose, { Schema } from "mongoose";  

const meetingSchema = new Schema(
    {
        userId : { type : String , require : true},
        meetingCode : {type : String , required : true},
        date : {type : Date , default : Date.now , required : true}
    }
)
const Meetings = mongoose.model("Meeting",meetingSchema);

export {Meetings};