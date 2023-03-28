const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const ColorHash = require("color-hash").default;

dotenv.config();
const indexRouter = require("./routes");
// 서버를 실행할 때 몽고디비에 바로 접속하도록 서버와 몽구스를 연결:
const connect = require("./schemas");
// 웹소켓을 익스프레스 서버와 연결:
const webSocket = require("./socket");

const app = express();
app.set("port", process.env.PORT || 8005);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});
connect();

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

// 사용자를 구분하기 위해 세션 아이디 (req.sessionID)를 바탕으로 색상을 만들어서 세션에 저장(req.session.color를 사용자 아이디처럼 사용):
app.use((req, res, next) => {
  if (!req.session.color) {
    const colorHash = new ColorHash();
    req.session.color = colorHash.hex(req.sessionID);
    console.log(req.session.color, req.sessionID);
  }
  next();
});

app.use("/", indexRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// 웹소켓을 익스프레스 서버와 연결:
const server = app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});

webSocket(server, id);
