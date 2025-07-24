import mongoose from "mongoose";


const chatSchema = new mongoose.Schema({
  message: String,
  response: String,
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model("Chat", chatSchema);



