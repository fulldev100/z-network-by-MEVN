const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// var axios = require('axios');
// var FormData = require('form-data');

const { tokenQuery, insertTokenQuery, updateTokenQuery, userQuery, allUsersQuery, registerQuery, updateStatusQuery, getAllNotificationQuery } = require('../lib/query');

const { executeQuery } = require('../db');

const router = express.Router();

const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs')

const AWS_ACCESS_KEY_ID = "AKIAVBHONSQBZMPWQAUF";
const AWS_SECRET_ACCESS_KEY = "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";
const BUCKET = "fadaimageupload";

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});
const s3Content = new AWS.S3();
const upload = multer({ dest: "upload/avatar/" });

const auth = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const userResult = await executeQuery(userQuery, [username]);
    const user = userResult[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if the password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ status: false, code: 401, message: 'Invalid username or password' });
    }

    req.session.user = {
      userID: user.userId,
      username: username,
      userSessionPass: password,
      userVerified: true,
      userVerifiedExpiry: 1000 * 60 * 60 * 36,
      loginAttempts: 0,
      lastAttemptTime: 0
    }

    const token = jwt.sign(
        { 
            id: user.userId,
            username: user.username,
            avatar: user.avatar,
        }, 
        'my_secret_key',
        { expiresIn: '1000h' }
    );

    const getTokenResult = await executeQuery(tokenQuery, [user.userId])
    if(getTokenResult && getTokenResult[0])
    {
      await executeQuery(updateTokenQuery, [token, user.userId])
    }
    else {
      await executeQuery(insertTokenQuery, [user.userId, token])
    }

    res.json({ status: true, code: 200, message: "", token: token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, code: 500, message: 'Internal server error' });
  }
});

// Registration
router.post('/register', upload.single("file"), async (req, res) => {
  const { username, password } = req.body;
  const status = "online";
  console.log(req.body);

  try {
    // Check if the user already exists
    const userResult = await executeQuery(userQuery, [username]);
    const user = userResult[0];

    if (user) {
      return res.status(409).json({ status: false, message: 'Username already exists' });
    }

    const image = req.file;
    console.log(image.path);

    const fileStream = fs.createReadStream(image.path)

    const s3Params = {
        Bucket: BUCKET,
        Key: image.originalname,
        Body: fileStream
    };

    s3Content.upload(s3Params, async function(err, data) {
        let avatar;

        if (err) {
            console.log('Error uploading file:', err);
            avatar = "http://localhost:5154/images/avatar.jpg";
        } else {
            console.log('File uploaded successfully. Location:', data.Location);
            avatar = data.Location;
        }

        // Hash the password    
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert the new user into the database
        await executeQuery(registerQuery, [ username, hashedPassword, avatar, status]);

        res.json({ message: 'Registration successful' });
    });

    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get notification
router.get('/notification', auth, async (req, res) => {
  const userId = req.user.id;

  try {
      // Get Info
      const notificationInfo = await executeQuery(getAllNotificationQuery, [userId, 10])
  
      if (!notificationInfo) {
          return res.status(404).json({ status: false, message: 'Info not found' });
      }
      const profile = {
          status: true,
          notifications: notificationInfo
      }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

// Modify Status
router.put('/status', auth, async (req, res) => {
    const { status } = req.body;
    const userId = req.user.id;

    try {
        // Update the user's profile
        await executeQuery(updateStatusQuery, [status, userId]);
    
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

// Get Users
router.get('/all', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        // Update the user's profile
        const result = await executeQuery(allUsersQuery);
        console.log(result)
    
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

module.exports = router;