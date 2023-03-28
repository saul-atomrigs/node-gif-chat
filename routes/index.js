const express = require("express");
const {
  rendreMain,
  renderRoom,
  renderChat,
  enterRoom,
  removeRoom,
} = require("../controllers");

const Room = require("../schemas/room");
const Chat = require("../schemas/chat");

const router = express.Router();

// 메인화면 렌더링: router.get("/", renderMain)
router.get("/", async (req, res, next) => {
  try {
    const rooms = await Room.find({});
    res.render("main", { rooms, title: "GIF 채팅방" });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 방 생성 화면 렌더링: router.get("/room", renderRoom)
router.get("/room", (req, res) => {
  res.render("room", { title: "GIF 채팅방 생성" });
});

// 방 생성 라우터: router.post("/room", createRoom)
router.post("/room", async (req, res, next) => {
  try {
    const newRoom = await Room.create({
      title: req.body.title,
      max: req.body.max,
      owner: req.session.color,
      password: req.body.password,
    });
    // io객체를 get한다:
    const io = req.app.get("io");
    // /room 네임스페이스에 연결된 모든 클라이언트에 데이터를 보낸다:
    io.of("/room").emit("newRoom", newRoom);
    res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 방 접속 라우터: router.get("/room/:id", enterRoom)
router.get("/room/:id", async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id });
    const io = req.app.get("io");
    // 이미 존재하는 방인지 확인:
    if (!room) {
      return res.redirect("/?error=존재하지 않는 방입니다.");
    }
    // 비밀번호가 있는 방이면 && 비밀번호가 맞는지 확인:
    if (room.password && room.password !== req.query.password) {
      return res.redirect("/?error=비밀번호가 틀렸습니다.");
    }
    // 방 목록:
    const { rooms } = io.of("/chat").adapter;
    // 허용 인원을 초과하는지 확인:
    if (
      rooms &&
      rooms[req.params.id] &&
      room.max <= rooms[req.params.id].length
    ) {
      return res.redirect("/?error=허용 인원이 초과하였습니다.");
    }
    return res.render("chat", {
      room,
      title: room.title,
      chats: [],
      user: req.session.color,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 방 제거 라우터: router.delete("room/:id", removeRoom)
router.delete("/room/:id", async (req, res, next) => {
  try {
    await Room.remove({ _id: req.params.id });
    await Chat.remove({ room: req.params.id });
    res.send("ok");
    setTimeout(() => {
      req.app.get("io").of("/room").emit("removeRoom", req.params.id);
    }, 2000);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
