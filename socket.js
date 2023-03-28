const SocketIO = require("socket.io");

module.exports = (server, app, sessionMiddleware) => {
  // 두번째 인자로 클라이언트가 접속할 경로인 path를 넣어준다:
  const io = SocketIO(server, { path: "/socket.io" });
  // 라우터에서 io 객체를 사용할 수 있게 set해둔다(req.app.get("io")로 접근 가능하다):
  app.set("io", io);
  // of메서드는 Socket.IO에 네임스페이스를 부여하는 메서드이다. 네임스페이스를 부여하면 여러 개의 네임스페이스를 만들 수 있다.
  const room = io.of("/room");
  const chat = io.of("/chat");

  // wrap함수는 미들웨어를 (req, res, next) => next() 형식으로 변경해주는 함수이다:
  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);
  // chat.use 메서드에 미들웨어 장착한다. 이 미들웨어는 chat네임스페이스에 웹소켓이 연:
  chat.use(wrap(sessionMiddleware));

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
    // socket.request.headers.referrer에 브라우저 주소가 들어있다. 여기서 url의 마지막 부분을 가져와서 방 아이디(roomId)로 사용한다:
    const req = socket.request;
    const {
      headers: { referer },
    } = req;
    const roomId = referer
      .split("/")
      [referer.split("/").length - 1].replace(/\?.+/, "");
    socket.join(roomId);

    // socket.to(방아이디) 메서드로 특정 방에 데이터를 보낼 수 있다:
    socket.to(roomId).emit("join", {
      user: "system",
      // 세션 미들웨어와 Socket.IO를 연결했으므로, 웹소켓에서 세션을 사용할 수 있다:
      chat: `${req.session.color}님이 입장하셨습니다.`,
    });

    socket.on("disconnect", () => {
      console.log("chat 네임스페이스 접속 해제");
      socket.leave(roomId);
      // socket.adapter.rooms[방아이디]에는 해당 방에 연결된 소켓들의 정보가 들어있다. length로 현재 방에 몇 명이 있는지 확인할 수 있다:
      const currentRoom = socket.adapter.rooms[roomId];
      const userCount = currentRoom ? currentRoom.length : 0;
      if (userCount === 0) {
        // 유저가 0명이면 방 삭제
        const signedCookie = cookie.sign(
          req.signedCookies["connect.sid"],
          process.env.COOKIE_SECRET
        );
        const connectSID = `${signedCookie}`;
        axios
          .delete(`http://localhost:8005/room/${roomId}`, {
            headers: {
              Cookie: `connect.sid=s%3A${connectSID}`,
            },
          })
          .then(() => {
            console.log("방 제거 요청 성공");
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        socket.to(roomId).emit("exit", {
          user: "system",
          chat: `${req.session.color}님이 퇴장하셨습니다.`,
        });
      }
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
