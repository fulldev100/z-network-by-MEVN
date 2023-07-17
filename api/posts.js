const express = require('express');
const { executeQuery } = require('../db');

const { insertPostQuery, insertPostPhotoQuery, issertPostVideoQuery, getMyPostsQuery, userQuery } = require('../lib/query');

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

router.post('/addImage', auth, async (req, res) => {
  const userId = req.user.id;
  const { upload } = req.body;

  try {
      // Update the user's profile
      let base64Image = upload.split(';base64,').pop();
      let timestamp = Date.now();
      fs.writeFile('public/posts/' + timestamp + '.png', base64Image, {encoding: 'base64'}, function(err) {  
          res.json({ status: true, message: "Friend added successfully!", image: timestamp + '.png'})
      });

      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/addGallery', auth, async (req, res) => {
  const userId = req.user.id;
  const { uploads } = req.body;

  try {
      let fileIndex = 0
      let filePaths = []
      if (uploads.length > 0)
      uploads.forEach(element => {
        let base64Image = element.split(';base64,').pop();
        let timestamp = Date.now();
        fs.writeFile('public/posts/' + timestamp + '.png', base64Image, {encoding: 'base64'}, function(err) {  
          filePaths.push(timestamp + '.png')
          fileIndex++;
          if (fileIndex == uploads.length)
            res.json({ status: true, message: "Friend added successfully!", images: filePaths})
        });
      });
      else
        res.status(409).json({ status: false, message: 'Please select gallery image.' });
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/createPost', auth, async (req, res) => {
  const userId = req.user.id;
  const { postTitle, postContent, postMainPhoto, postPhotos, postVideo } = req.body;

  try {
      const post = await executeQuery(insertPostQuery, [userId, postTitle, postContent, postMainPhoto])

      if (post) {
        const postID = post.insertId;
        if (postPhotos.length > 0) {
          postPhotos.forEach(async element => {
            await executeQuery(insertPostPhotoQuery, [postID, element])
          });
        }
        if (postVideo != "")
          await executeQuery(issertPostVideoQuery, [postID, postVideo])
        res.json({ status: true, message: "Post created successfully!"})
      }
      else {
        res.status(409).json({ status: false, message: "Post failed"})
      }
      
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/getMyPosts', auth, async (req, res) => {
  const userId = req.user.id;
  const { userID } = req.body;
  try {
    
    const myPosts = await executeQuery(getMyPostsQuery, [userID])

    res.json({ status: true, message: "Getting data successfully", posts: myPosts})
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

module.exports = router;