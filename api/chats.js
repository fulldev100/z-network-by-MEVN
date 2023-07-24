const express = require('express');
const { executeQuery } = require('../db');
const crypto = require('crypto');
const { updateMessageStateQuery, gettingMessageList, gettingUnreadMessageCount, gettingContactList_following, gettingContactList_follower, insertMessageQuery } = require('../lib/query');

const router = express.Router();

const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs')

const AWS_ACCESS_KEY_ID = "AKIAVBHONSQBZMPWQAUF";
const AWS_SECRET_ACCESS_KEY = "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";
const encryptionKey = 'znetworkpoencryptionkeyisprivate';

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1'
});

const auth = require('../middleware/auth');

router.post('/getChatList', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    
    const contactList_following = await executeQuery(gettingContactList_following, [userId])
    const contactList_follower = await executeQuery(gettingContactList_follower, [userId])

    let contactList = []

    if (contactList_following.length > 0)
      contactList_following.forEach(following => {
        contactList.push(following)
        contactList_follower.forEach(follower => {
          if (following.to_ID != follower.from_ID) 
            contactList.push(follower)
        });
      });
    else 
      contactList_follower.forEach(follower => {
        contactList.push(follower)
        contactList_following.forEach(following => {
          if (following.to_ID != follower.from_ID) 
            contactList.push(follower)
        });
      });

    let options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }; // weekday: 'long', 

    contactList.forEach((contact, _index) => {
        executeQuery(gettingMessageList, [contact.from_ID, contact.to_ID, contact.to_ID, contact.from_ID])
        .then((messages) => {

            let message_item = { id: null, from_id: null, to_id: null, message: null, seen: 0, shared_id: null, created_at: null }
            if (messages && messages.length > 0) {
                message_item = messages[messages.length - 1]
                var date = new Date;
                date.setTime(message_item.created_at);

                const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
                let decrypted = decipher.update(message_item.message, 'hex', 'utf8');
                decrypted += decipher.final('utf8');

                message_item.message = decrypted
                
                message_item.created_at = (date.getHours() < 10 ? '0'+date.getHours(): date.getHours()) + ':' + (date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes())
                contactList[_index]['last_message'] = message_item
            }
            else contactList[_index]['last_message'] = message_item

            let other_ID = contact.from_ID
            if (contact.from_ID == userId) other_ID = contact.to_ID

            executeQuery(gettingUnreadMessageCount, [other_ID, userId])
            .then((result) => {
              contactList[_index]['unread'] = result.length
              res.json({ status: true, message: "Getting data successfully", contacts: contactList})
            })
            .catch((err) => {
              console.log(err)
            })

            
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

        await executeQuery(updateMessageStateQuery, [1, userID, userId])

        let options = { hour: 'numeric', minute: 'numeric' }; // weekday: 'long', 

        messages.forEach(message => {
          var date = new Date;
          date.setTime(message.created_at);

          const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
          let decrypted = decipher.update(message.message, 'hex', 'utf8');
          decrypted += decipher.final('utf8');

          message.message = decrypted

          message.created_at = (date.getHours() < 10 ? '0'+date.getHours(): date.getHours()) + ':' + (date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes())
        });
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
        const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const newMessage = await executeQuery(insertMessageQuery, [userId, userID, encrypted]);
        res.json({status: true, newMessage: newMessage})

    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
})


module.exports = router;