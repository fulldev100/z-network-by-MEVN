const express = require('express');
const { executeQuery } = require('../db');

const { 
  insertShareQuery, sigleMyShareQuery, deleteSingleShareQuery,
  deleteSingleLikeQuery, sigleMyLikeQuery, insertLikeQuery, insertPostQuery, insertPostPhotoQuery, 
  issertPostVideoQuery, getMyPostsQuery, insertCommentQuery, getCommentsQuery } = require('../lib/query');

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
    
    let myPosts = await executeQuery(getMyPostsQuery, [userID])

    let options = { year: 'numeric', month: 'long', day: 'numeric' }; // weekday: 'long', 

    myPosts.forEach((element, _index) => {
      executeQuery(getCommentsQuery, [element.post_id])
      .then((result) => {
        
        result.forEach(item => {
          let comment_date = new Date(item.comment_created)
          item.comment_created = comment_date.toLocaleDateString("en-US", options)
        });
        myPosts[_index]['comments'] = result;
        var today  = new Date(element.post_created);
        myPosts[_index]['post_created'] = today.toLocaleDateString("en-US", options)
        if (_index == myPosts.length - 1) {
          res.json({ status: true, message: "Getting data successfully", posts: myPosts})
        }
      })
      .catch((err) => {
        res.status(500).json({ status: false, message: 'Internal server error' });
      })

    });
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/addCommentPost', auth, async (req, res) => {
  const userId = req.user.id;
  const { post_id, content } = req.body;
  try {
    
    await executeQuery(insertCommentQuery, [userId, post_id, content])

    res.json({ status: true, message: "Created comment successfully" })
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/doLike', auth, async (req, res) => {
  const userId = req.user.id;
  const { post_id } = req.body;
  try {
    
    const mylike = await executeQuery(sigleMyLikeQuery, [userId, post_id])

    if (mylike && mylike[0]) {
      await executeQuery(deleteSingleLikeQuery, [userId, post_id])
      res.json({ status: false, message: "Deleted successfully" })
    }
    else {
      await executeQuery(insertLikeQuery, [userId, post_id])
      res.json({ status: true, message: "Recommended successfully" })
    }
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

router.post('/doShare', auth, async (req, res) => {
  const userId = req.user.id;
  const { post_id } = req.body;
  try {

    const myshare = await executeQuery(sigleMyShareQuery, [userId, post_id])

    if (myshare && myshare[0]) {
      await executeQuery(deleteSingleShareQuery, [userId, post_id])
      res.json({ status: false, message: "Deleted successfully" })
    }
    else {
      await executeQuery(insertShareQuery, [userId, post_id])
      res.json({ status: true, message: "Shared successfully" })
    }
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
})

module.exports = router;