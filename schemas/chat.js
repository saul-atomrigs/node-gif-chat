/**
 * 채팅 스키마
 */

const mongoose = require("mongoose");

const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;
const chatSchema = new Schema({
  // 채팅방 아이디:
  room: {
    type: ObjectId, // room 필드는 Room 스키마의 ObjectId를 참조한다.
    required: true,
    ref: "Room",
  },
  // 채팅을 한 사람:
  user: {
    type: String,
    required: true,
  },
  // 채팅 내용:
  chat: String,
  // GIF 이미지 주소:
  gif: String,
  // 생성 시간:
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Chat", chatSchema);
