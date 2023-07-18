const express = require('express');
const app = express();
const users = require('./api/users');
const profiles = require('./api/profiles');
const posts = require('./api/posts');
const chats = require('./api/chats');
const todoRouter = require('./api/todos');
const cors = require("cors")
const socket = require("socket.io");
const { insertBellQuery, existBellQuery } = require('./lib/query');
const { executeQuery } = require('./db');
const bodyParser = require('body-parser');

app.use(cors({
  origin: '*'
}));

//app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json({limit: '50mb'})); 
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
// app.use(express.static('public'));
app.use(express.json());

// Routes
app.use('/', todoRouter);
app.use('/api/users', users);
app.use('/api/profiles', profiles);
app.use('/api/posts', posts);
app.use('/api/chats', chats)

// Start the server
const port = 3000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const activeUsers = new Set();

io.on("connection", function (socket) {

  socket.on("new user", function (data) {
    socket.userId = data;
    activeUsers.add(data);
    io.emit("new user", [...activeUsers]);
  });

  socket.on("disconnect", () => {
    activeUsers.delete(socket.userId);
    io.emit("user disconnected", socket.userId);
  });

  socket.on("chat_message", function (data) {
    executeQuery(insertBellQuery, [data.to, 'comment', data.message, 1])
    .then((re) => io.emit("chat_message", data.send))
    .catch((err) => console.log("err"))
  });
  
  socket.on("typing", function (data) {
    socket.broadcast.emit("typing", data);
  });
});