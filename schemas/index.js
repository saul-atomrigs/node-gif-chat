/**
 * 몽고디비와 연결
 */

const mongoose = require("mongoose");

// env 파일에서 몽고디비 관련 환경변수를 불러온다:
const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;

// 연결 함수 만들기:
const connect = () => {
  if (NODE_ENV !== "production") {
    mongoose.set("debug", true);
  }
  mongoose.connect(
    MONGO_URL,
    {
      dbName: "gifchat",
      useNewUrlParser: true,
      useCreateIndex: true,
    },
    (error) => {
      if (error) {
        console.log("몽고디비 연결 에러", error);
      } else {
        console.log("몽고디비 연결 성공");
      }
    }
  );
};

// 연결 에러:
mongoose.connection.on("error", (error) => {
  console.error("몽고디비 연결 에러", error);
});

// 연결이 끊어졌을 때:
mongoose.connection.on("disconnected", () => {
  console.error("몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.");
  connect();
});

module.exports = connect;
