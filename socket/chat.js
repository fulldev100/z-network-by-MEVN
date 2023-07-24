const socket = require("socket.io");
const { insertBellQuery, updateMessageStateQuery } = require('../lib/query');
const { executeQuery } = require('../db');
let io;
exports.socketChatConnection = (server) => {
  io = socket(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const activeUsers = new Set();
  
  io.on("connection", function (socket) {
  
    socket.on("new_user", function (data) {
      socket.userId = data;
  
      activeUsers.forEach(x => x.userId === data ? activeUsers.delete(x) : x)
      activeUsers.add({userId: data, socketID: socket.id});
  
      console.log(activeUsers)
      io.emit("new_user", [...activeUsers]);
    });
  
    socket.on("disconnected", () => {
      console.log("disconnected: ", socket.userId)
      activeUsers.delete(socket.userId);
      io.emit("user_disconnected", socket.userId);
    });
  
    socket.on("message_seen", (data) => {
       // If my socket id doesn't exist, add new user
       let existMe = false
       for (const [key, value] of activeUsers.entries()) {
         if (value.userId == data.sender) {
           existMe = true;
           break
         }
       }
       if (existMe == false) {
         activeUsers.add({userId: data.sender, socketID: socket.id});
       }
  
      if (data.sender != null && data.to != null)
      {
        socket.broadcast.emit("message_seen", {sender: data.sender, to: data.to})
        executeQuery(updateMessageStateQuery, [1, data.sender, data.to])
        .then((result) => {})
        .catch(() => {})
      }
    });
  
    socket.on("chat_message", function (data) {
  
      // If my socket id doesn't exist, add new user
      let existMe = false
      for (const [key, value] of activeUsers.entries()) {
        if (value.userId == data.sender) {
          existMe = true;
          break
        }
      }
      if (existMe == false) {
        activeUsers.add({userId: data.sender, socketID: socket.id});
      }
  
      let date = new Date();
      let current_time = (date.getHours() < 10 ? '0'+date.getHours(): date.getHours()) + ':' + (date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes())
      let existReceiverUser = false;
  
      // finding the socket id of receiver
      for (const [key, value] of activeUsers.entries()) {
        if (value.userId == data.to) {
          io.to(value.socketID).emit("chat_message", { sender: data.sender, to: data.to, message: data.message, created_at: current_time })
          existReceiverUser = true;
          break;
        }
      }
  
      if (existReceiverUser == false) {
        socket.broadcast.emit("chat_message", { sender: data.sender, to: data.to, message: data.message, created_at: current_time })
  
        executeQuery(insertBellQuery, [data.to, 'envelope-square', data.message, 1])
        .then((re) => {})
        .catch((err) => console.log("err"))
      }
  
    });
    
    socket.on("typing", function (data) {
      // socket.broadcast.emit("typing", data);
      // If my socket id doesn't exist, add new user
      let existMe = false
      for (const [key, value] of activeUsers.entries()) {
        if (value.userId == data.sender) {
          existMe = true;
          break
        }
      }
      if (existMe == false) {
        activeUsers.add({userId: data.sender, socketID: socket.id});
      }
  
      let existReceiverUser = false;
      // finding the socket id of receiver
      for (const [key, value] of activeUsers.entries()) {
        if (value.userId == data.to) {
          existReceiverUser = true
          io.to(value.socketID).emit("typing", { sender: data.sender, to: data.to })
          break;
        }
      }
  
      if (existReceiverUser == false) {
        socket.broadcast.emit("typing", { sender: data.sender, to: data.to })
      }
    });
  });
};