const express = require('express');
const { executeQuery } = require('../db');

const { gettingContactList, gettingMessageList, gettingUnreadMessageCount, insertMessageQuery } = require('../lib/query');

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
const uploadBanner = multer({ dest: "upload/banner/" });
const uploadImage = multer({ dest: "upload/trendImg/" });

const auth = require('../middleware/auth');

router.post('/getChatList', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    
    let contactList = await executeQuery(gettingContactList, [userId, userId])

    let options = { year: 'numeric', month: 'long', day: 'numeric' }; // weekday: 'long', 

    contactList.forEach((contact, _index) => {
        executeQuery(gettingMessageList, [contact.from_ID, contact.to_ID, contact.to_ID, contact.from_ID])
        .then((messages) => {

            let message_item = { id: null, from_id: null, to_id: null, message: null, seen: 0, shared_id: null, created_at: null }
            if (messages && messages.length > 0) {
                message_item = messages[messages.length - 1]
                contactList[_index]['last_message'] = message_item
            }
            else contactList[_index]['last_message'] = message_item

            contactList[_index]['unread'] = 0
            res.json({ status: true, message: "Getting data successfully", contacts: contactList})
        })
        .catch((err) => {
         //   res.status(500).json({ status: false, message: 'Internal server error' });
        })
    });

    
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/getMessages', auth, async (req, res) => {
    const userId = req.user.id;
    const { userID } = req.body;
    try {
        
        const messages = await executeQuery(gettingMessageList, [userId, userID, userID, userId]);
        res.json({status: true, messages: messages})

    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
})

router.post('/sendMessage', auth, async (req, res) => {
    const userId = req.user.id;
    const { userID, content } = req.body;
    try {
        
        const newMessage = await executeQuery(insertMessageQuery, [userId, userID, content]);
        res.json({status: true, newMessage: newMessage})

    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
})


module.exports = router;