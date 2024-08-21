const moment = require("moment");

let students = [];
let allQuestions = [];
let connectedClients = {};
class Connection {
  constructor({ io, socket }) {
    this.io = io;
    this.socket = socket;

    socket.join(socket.userId);
    socket.on("message", (...args) => this.handleMessage(...args));

    socket.on("typing-start", (...args) => this.handleTypingStart(...args));
    socket.on("typing-end", (...args) => this.handleTypingEnd(...args));
    socket.on("new-student-joined", (...args) =>
      this.handleNewStudentJoined(...args)
    );
    socket.on("new-question-published", (...args) =>
      this.handleQuestionPosted(...args)
    );
    socket.on("answer-submitted", (...args) =>
      this.handleAnswerSubmited(...args)
    );

    socket.on("kick-out", (socketId) => {
      console.log({ socketId, connectedClients });
      if (connectedClients[socketId]) {
        io.to(socketId).disconnectSockets(); // Disconnect the specific socket
        delete connectedClients[socketId];
        students = students.filter((e) => e.userId != socketId);
        this.io.emit("load-students", students);
        console.log(`Client ${socketId} has been kicked out.`);
      }
    });

    socket.on("disconnect", () => {
      console.log("user disconnected", socket.userId);
      students = students.filter((e) => e.userId != socket.userId);
      this.io.emit("load-students", students);
    });
  }

  handleMessage(data, socketId) {
    this.io.to(socketId).emit("message", data);
  }

  handleNewStudentJoined(data) {
    students = students.filter((e) => e.userId !== data.userId);
    if (data.userName) {
      students.push({ ...data, joinedAt: moment().toDate() });
    }
    this.io.emit("load-students", students);
  }

  handleQuestionPosted(data, socketId) {
    let currentQuestion = {
      title: data.title,
      id: data.id,
      options: data.options,
      duration: data.duration,
      postedBy: socketId,
      postedAt: moment().toDate(),
    };
    allQuestions.push(currentQuestion);
    console.log(allQuestions);
    this.io.emit("question-posted", currentQuestion);
    let now = moment();
    this.io.emit(
      "load-questions",
      allQuestions
        .filter((e) => e.postedBy === socketId)
        .filter((question) => {
          const postedAtMoment = moment(question.postedAt);
          const expirationTime = postedAtMoment.add(
            question.duration,
            "seconds"
          );
          return expirationTime.isBefore(now);
        })
        .reverse()
    );
  }

  handleAnswerSubmited(data, socketId) {
    let questionId = data.questionId;
    let question = allQuestions.find((each) => each.id === questionId);
    question.options[data.answerId].poll += 1;

    let totalVotes = question.options.reduce((acc, e) => e.poll + acc, 0);
    let updatedPollPercentages = question.options.map((each) => {
      each.pollPercentage =
        totalVotes > 0
          ? parseFloat((each.poll / totalVotes) * 100).toFixed(2)
          : 0;
      return each;
    });

    question.options = updatedPollPercentages;

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
    connectedClients[socket.userId] = "connected";
    new Connection({ io, socket });
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
      users.push({
        socketId: id,
        userId: socket.userId,
      });
    }
    socket.emit("load-students", students);
    let now = moment();
    socket.emit(
      "load-questions",
      allQuestions
        .filter((e) => e.postedBy === socket.userId)
        .filter((question) => {
          const postedAtMoment = moment(question.postedAt);
          const expirationTime = postedAtMoment.add(
            question.duration,
            "seconds"
          );
          return expirationTime.isBefore(now);
        })
        .reverse()
    );
  });
}

module.exports = initiateSocket;
