const express = require('express');
const app = express();
const users = require('./api/users');
const profiles = require('./api/profiles');
const posts = require('./api/posts');
const todoRouter = require('./api/todos');
const cors = require("cors")

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


// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});