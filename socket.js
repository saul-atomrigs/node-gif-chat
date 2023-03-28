const SocketIO = require("socket.io");

module.exports = (server) => {
  // 두번째 인자로 클라이언트가 접속할 경로인 path를 넣어준다:
  const io = SocketIO(server, { path: "/socket.io" });
  // 라우터에서 io 객체를 사용할 수 있게 set해둔다(req.app.get("io")로 접근 가능하다):
  app.set("io", io);
  // of메서드는 Socket.IO에 네임스페이스를 부여하는 메서드이다. 네임스페이스를 부여하면 여러 개의 네임스페이스를 만들 수 있다.
  const room = io.of("/room");
  const chat = io.of("/chat");

  // /room 네임스페이스에 접속했을 때:
  room.on("connection", (socket) => {
    console.log("room 네임스페이스에 접속");
    socket.on("disconnect", () => {
      console.log("room 네임스페이스 접속 해제");
    });
  });

  // /chat 네임스페이스에 접속했을 때:
  chat.on("connection", (socket) => {
    console.log("chat 네임스페이스에 접속");
    const req = socket.request;
    const {
      headers: { referer },
    } = req;
    const roomId = referer
      .split("/")
      [referer.split("/").length - 1].replace(/\?.+/, "");
    socket.join(roomId);

    socket.on("disconnect", () => {
      console.log("chat 네임스페이스 접속 해제");
      socket.leave(roomId);
    });
  });

  // 웹소켓 연결 시:
  io.on("connection", (socket) => {
    const req = socket.request;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; // 클라이어트 ip를 알아내는 유명한 방법 중 하나
    console.log("새로운 클라이언트 접속", ip);
    // 연결 종료 시:
    socket.on("disconnect", () => {
      console.log("클라이언트 접속 해제", ip, socket.id);
      clearInterval(socket.interval);
    });
    // 에러 시:
    socket.on("error", (error) => {
      console.error(error);
    });
    // 클라이언트로부터 메시지 수신 시:
    socket.on("reply", (data) => {
      console.log(data);
    });

    // 3초마다 클라이언트로 메시지 전송:
    socket.interval = setInterval(() => {
      socket.emit("news", "Hello Socket.IO");
    }, 3000);
  });
};
