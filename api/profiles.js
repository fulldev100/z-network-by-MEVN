const express = require('express');
const { executeQuery } = require('../db');

const { deleteFriendQuery, userInfoByUsernameQuery, updateAvatarQuery, updateBannerAndDescQuery, insertBannerAndDesInfoQuery, followersQuery, allPosibleFriendQuery, userInfoQuery, infoQuery, trendQuery, friendQuery, sigleFriendQuery, followingQuery, insertInfoQuery, updateInfoQuery, insertTrendQuery, insertFriendQuery } = require('../lib/query');

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

// Get Profile
router.get('/', auth, async (req, res) => {
    const userId = req.user.id;
  
    try {
        // Get Info
        const userOriginalInfo = await executeQuery(userInfoQuery, [userId])
        const infoResult = await executeQuery(infoQuery, [userId]);
        const userData =  userOriginalInfo[0];
        const info = infoResult[0];
    
        if (!userOriginalInfo) {
            return res.status(404).json({ status: false, message: 'Info not found' });
        }

        // Get Trends
      //   const trendResult = await executeQuery(trendQuery, [userId]);

        // Get Friends
      //  const friendResult = await executeQuery(friendQuery, [userId]);

        const profile = {
            status: true,
            user: {
              "avatar": userData.avatar,
              "userID": userData.userId,
              "username": userData.username,
              "balance": userData.balance
            },
            info: info,
        //    trends: trendResult,
        //    friends: friendResult
        }
  
      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
});

// Get Profile with ID
router.post('/getProfile', auth, async (req, res) => {
  const myUserId = req.user.id;
  const { username } = req.body;

  try {
    // Get Info
      let userOriginalInfo = await executeQuery(userInfoQuery, [myUserId])
      if (username != '') {
        userOriginalInfo = await executeQuery(userInfoByUsernameQuery, [username])
      }
      
      const userData =  userOriginalInfo[0];

      if (!userOriginalInfo || !userData) {
          return res.status(404).json({ status: false, message: 'Info not found' });
      }

      let userID = userData.userId

      const infoResult = await executeQuery(infoQuery, [userID == '' ? myUserId : userID]);
      const info = infoResult[0];
      // Get Trends
      //   const trendResult = await executeQuery(trendQuery, [userId]);

      // Get Friends
      const friendResult = await executeQuery(friendQuery, [userID == '' ? myUserId : userID]);
      const followingResult = await executeQuery(followingQuery, [userID == '' ? myUserId : userID])
      const allPosibleFriendResult = await executeQuery(allPosibleFriendQuery, [myUserId])
      const followersResult = await executeQuery(friendQuery, [userID == '' ? myUserId : userID])

      var followed = false;
      // Get signle friend
      if (userID != "") {
        const sigleFriendResult = await executeQuery(sigleFriendQuery, [myUserId, userID]);

        if (sigleFriendResult && sigleFriendResult[0] ) followed = true
      }

      const profile = {
          status: true,
          user: {
            "userID": userData.userId,
            "username": userData.username,
            "avatar": userData.avatar
          },
          me: userID == "" || myUserId == userData.userId,
          followed: followed,
          info: info,
          friends: allPosibleFriendResult, // (userID == "" || userID == userData.userId) ? allPosibleFriendResult : friendResult,
          followingFriends: followingResult,
          followers: followersResult,
          message: ""
      //    trends: trendResult,
      //    friends: friendResult
      }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

// Create Info
router.post('/info', auth, uploadBanner.single("file"), async (req, res) => {
    const { description, email, location } = req.body;
    const user_ID = req.user.id;

    try {
        // Check if the info already exists
        const infoResult = await executeQuery(infoQuery, [user_ID]);
        const info = infoResult[0];
    
        if (info) {
          return res.status(409).json({ message: 'Info already exists' });
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
            let banner;
    
            if (err) {
                console.log('Error uploading file:', err);
                banner = "http://localhost:5154/images/banner.jpg";
            } else {
                console.log('File uploaded successfully. Location:', data.Location);
                banner = data.Location;
            }
    
            // Insert the new user into the database
            await executeQuery(insertInfoQuery, [ user_ID, description, banner, email, location]);

            res.json({ message: "Info created successfully!" })
        });
    
        
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
})

// Update Info
router.put('/info', auth, async (req, res) => {
    const userId = req.user.id;
    const { description, email, location } = req.body;
  
    try {
        // Update the user's profile
        await executeQuery(updateInfoQuery, [description, email, location, userId]);

        res.json({ message: "Info updated successfully!" })
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// Add Trend
router.post('/trend', auth, uploadImage.single("file"), async (req, res) => {
    const { topic, text } = req.body;
    const user_ID = req.user.id;

    try {    
        const image = req.file;
        console.log(image.path);
    
        const fileStream = fs.createReadStream(image.path)
    
        const s3Params = {
            Bucket: BUCKET,
            Key: image.originalname,
            Body: fileStream
        };

        let imageURL;
        
        s3Content.upload(s3Params, async function(err, data) {            

            if (err) {
                console.log('Error uploading file:', err);
            } else {
                console.log('File uploaded successfully. Location:', data.Location);
                imageURL = data.Location;
            }

            if (!imageURL) console.log('ddd')
            // Insert the new user into the database
            await executeQuery(insertTrendQuery, [user_ID, topic, imageURL, text]);

            res.json({ message: "Trend added successfully!" })
        });            
                   
        
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }
})

// Add Friend
router.post('/friend', auth, async (req, res) => {
    const userId = req.user.id;
    const { friend } = req.body;

    try {
        // Update the user's profile
        const sigleFriendResult = await executeQuery(sigleFriendQuery, [userId, friend]);
        if (sigleFriendResult && sigleFriendResult[0]) {
          res.status(409).json({ status: false, message: 'Already added' });
        }
        else {
          await executeQuery(insertFriendQuery, [userId, friend]);
          res.json({ status: true, message: "Friend added successfully!" })
        }
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
})

// Remove Friend
router.post('/removeFriend', auth, async (req, res) => {
  const userId = req.user.id;
  const { friend } = req.body;

  try {
      // Update the user's profile
      await executeQuery(deleteFriendQuery, [userId, friend]);
      res.json({ status: true, message: "Friend removed successfully!" })
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/addAvatar', auth, async (req, res) => {
  const userId = req.user.id;
  const { upload } = req.body;

  try {
      // Update the user's profile
      let base64Image = upload.split(';base64,').pop();
      let timestamp = Date.now();
      fs.writeFile('public/users/' + timestamp + '.png', base64Image, {encoding: 'base64'}, function(err) {
          
          res.json({ status: true, message: "Friend added successfully!", image: timestamp + '.png'})
      });

      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

// Update Info
router.post('/update', auth, async (req, res) => {
  const userId = req.user.id;
  const { avatar, banner, description } = req.body;

  try {
      // Update the user's profile
      await executeQuery(updateAvatarQuery, [avatar, userId]);
      
      const current_info = await executeQuery(infoQuery, [userId])
      if (current_info && current_info[0])
        await executeQuery(updateBannerAndDescQuery, [banner, description, userId]);
      else {
        await executeQuery(insertBannerAndDesInfoQuery, [userId, banner, description])
      }

      res.json({ status: true, message: "Info updated successfully!" })
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});


module.exports = router;