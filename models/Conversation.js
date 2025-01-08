import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  sessionId: String,
  messages: [
    {
      role: String,
      content: String,
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
