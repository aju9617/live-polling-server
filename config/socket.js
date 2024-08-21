const moment = require("moment");

let students = [];
let allQuestions = [];

class Connection {
  constructor({ io, socket }) {
    this.io = io;
    this.socket = socket;

    socket.join(socket.userId);
    socket.on("message", (...args) => this.handleMessage(...args));

    socket.on("typing-start", (...args) => this.handleTypingStart(...args));
    socket.on("typing-end", (...args) => this.handleTypingEnd(...args));
    socket.on("new-student-joined", (...args) => console.log(args));
    socket.on("new-question-published", (...args) =>
      this.handleQuestionPosted(...args)
    );
    socket.on("answer-submitted", (...args) =>
      this.handleAnswerSubmited(...args)
    );

    socket.on("disconnect", () => console.log("user disconnected"));
  }

  handleMessage(data, socketId) {
    this.io.to(socketId).emit("message", data);
  }

  handleTypingStart(socketId) {
    console.log(socketId, "typing...");
    this.io.to(socketId).emit("typing-start");
  }

  handleTypingEnd(socketId) {
    this.io.to(socketId).emit("typing-end");
  }

  handleQuestionPosted(data, socketId) {
    console.log(data, socketId);
    let currentQuestion = {
      title: data.title,
      id: data.id,
      options: data.options,
      duration: data.duration,
      postedBy: socketId,
      postedAt: moment().toDate(),
    };
    allQuestions.push(currentQuestion);
    this.io.emit("question-posted", currentQuestion);
  }

  handleAnswerSubmited(data, socketId) {
    let questionId = data.questionId;
    let question = allQuestions.find((each) => each.id === questionId);
    question.options[data.answerId].poll += 1;

    this.io.emit("poll-result", {
      questionId,
      options: question.options,
    });
  }
}

function initiateSocket(io) {
  console.log("initializing socket connection");

  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Invalid user connection request"));
    }
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    console.log("new connection established!!", socket.userId);

    new Connection({ io, socket });
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
      users.push({
        socketId: id,
        userId: socket.userId,
      });
    }
    socket.emit("users", users);
  });
}

module.exports = initiateSocket;
