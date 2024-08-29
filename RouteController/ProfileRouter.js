const express = require('express');
const router = express.Router();
const Lyrics = require('../Models/Lyrics');
const Notification = require('../Models/Notification');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const moment = require('moment');
const User = require('../Models/Users');
const deleteResource = require('../Config/DeleteCloudinary');
const {uploadAvatar} = require('../Config/multerConfig')

//Middleware
const Middleware = (req, res, next) => {
    const token = req.cookies.loggedInUser;
    if (!token) {
      return res.status(200).json({ loggedIn: false });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; 
      next(); 
    } catch (err) {
      return res.status(401).json({ loggedIn: false });
    }
  };

  const formatTime = (createdAt) => {
    const now = moment();
    const timeDifference = now.diff(createdAt, 'days');
  
    if (timeDifference < 1) {
      return moment(createdAt).fromNow(); // e.g., "3m ago," "1h ago"
    } else if (timeDifference === 1) {
      // If the time difference is exactly 1 day, show "yesterday"
      return 'yesterday';
    } else {
      // Otherwise, show the full date
      return moment(createdAt).format('DD MMMM YYYY'); // e.g., "24 November 2024"
    }
  };
  

router.get('/pending',Middleware, async (req, res) => {
  const user = req.user;
  try {
    let pendingItems
    if (user.userType === "boss") {
    pendingItems = await Lyrics.find({ approved: false }).sort({ createdAt: -1 });
    }else{
      pendingItems = await Lyrics.find({uploadedBy_ID: user.user_id, approved: false}).sort({ createdAt: -1 });
    }

  res.json(pendingItems)

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

 // Get Notification
router.get('/notification', Middleware, async (req, res) => {
  const user = req.user;

  try {
    const notifications = await Notification.find({ recipient: user.user_id }).sort({ createdAt: -1 });

    res.json(notifications);
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
  

//Get View Item
router.get('/view/:id',Middleware, async (req, res) => {
  const {id} = req.params;
  const user = req.user;
  try {
    const viewItems = await Lyrics.findById(id);
    if(!viewItems){
      return res.status(404).json({ message: 'Post not found.' });
    }
    const formattedViewItems = {
      imagePath: viewItems.imagePath,
      uploadAt: formatTime(viewItems.createdAt),
      artistName : viewItems.artistName,
      id : viewItems._id,
      songName: viewItems.songName,
      uploadedBy: viewItems.uploadedBy,
      songType: viewItems.songType,
      lyrics: viewItems.lyrics,
      youtubeLink: viewItems.youtubeLink,
      approved: viewItems.approved,
    };
  
    if(viewItems.uploadedBy_ID === user.user_id ||user.userType === "boss" ){
    res.json(formattedViewItems);
    }else{
    return res.status(401).json({ Fuck_You: true });
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


//Approve Post
router.put('/approve', Middleware, async (req, res) => {
  const { id } = req.query;
  const user = req.user;

  if (user.userType !== "boss") {
    return res.status(401).json({ message: 'You do not have permission to approve this post.' });
  }

  try {
    const updatedItem = await Lyrics.findByIdAndUpdate(
      id,
      { approved: true },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Create a new notification for the user who uploaded the post
    const notification = new Notification({
      recipient: updatedItem.uploadedBy_ID,
      sender: user._id,
      type: 'approve',
      imagePath: "https://res.cloudinary.com/dn07zqh1o/image/upload/v1724188439/DeWatermark.ai_1724188279468_hyyrwy.jpg",
      post: updatedItem._id,
      message: `Your post has been approved and is now live! "${updatedItem.songName}"`,
      link: `/view/${updatedItem._id}`,
    });

    await notification.save();

    // Delete all unread notifications related to this post that were created for approval
    await Notification.updateMany(
      { post: updatedItem._id, type: 'post', read: false },
      { $set: { read: true } }
    );

    res.json({
      message: 'Post approved successfully.',
      post: updatedItem
    });

  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({ message: 'Server error. Could not approve post.' });
  }
});


//Delete Post
router.delete('/delete', Middleware, async (req, res) => {
  const { id } = req.query;
  const user = req.user;

  try {
    const postToDelete = await Lyrics.findById(id);

    if (!postToDelete) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    // Check if the user has permission to delete the post
    if (postToDelete.uploadedBy_ID !== user.user_id && user.userType !== "boss") {
      return res.status(403).json({ message: 'You do not have permission to delete this post.' });
    }

    // Delete the post
    await Lyrics.findByIdAndDelete(id);
    
    // Delete the image associated with the post if it exists
    if (postToDelete.imageName) {
      deleteResource(postToDelete.imageName);
    }

    // If the user is a boss, create a notification
    if (user.userType === "boss") {
      const notification = new Notification({
        recipient: postToDelete.uploadedBy_ID,
        sender: user.user_id,
        type: 'delete',
        imagePath: 'https://res.cloudinary.com/dn07zqh1o/image/upload/v1724187777/images_srxq9q.png',
        post: id,
        message: `Your post titled "${postToDelete.songName}" has been deleted by an admin. Click here to review our content guidelines.`,
        link: "/Guideline",
      });

      await notification.save();
    }

    // Mark all notifications related to this post as read
    await Notification.updateMany(
      { post: id,type:'post', read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error. Could not delete post.' });
  }
});
  

// Mark Notification as read
router.put('/notificationRead', Middleware, async (req, res) => {
  const { id } = req.query;
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true } 
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error. Could not update notification.' });
  }
});

// Mark all notification as read
router.put('/markallasread', Middleware, async (req, res) => {
  const user = req.user;
  try {
    const result = await Notification.updateMany(
      { recipient: user.user_id, read: false }, 
      { $set: { read: true } } 
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'No unread notifications found.' });
    }

    res.json({ message: 'All notifications marked as read', count: result.modifiedCount });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Server error. Could not update notifications.' });
  }
});
  

// Get Uploaded Lyrics of individual usee
router.get('/uploaded',Middleware, async (req, res) => {
const user = req.user;
try {
  const uploadedContent = await Lyrics.find({approved:true,uploadedBy_ID: user.user_id}).sort({ createdAt: -1 });

  if (!uploadedContent.length) {
    return res.status(404).json({ message: 'Data not found' });
  }
  // Format the createdAt field
  const formattedUploadedContent = uploadedContent.map(item => ({
  view_count: item.view_count,
  imagePath: item.imagePath,
  createdAt: moment(item.createdAt).format('DD MMMM YYYY'),
  artistName : item.artistName,
  id : item._id,
  songName: item.songName
}));
res.json(formattedUploadedContent);
} catch (error) {
  console.error('Error fetching data:', error);
  res.status(500).json({ message: 'Server error' });
}
});

// Replace profile pic
router.post('/avatarchange', Middleware, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const { imageName, user_id } = req.user;
    if (imageName) {
      deleteResource(imageName);
    }
    const newImage = req.file;
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      {
        imageName: newImage.filename,
        avatar: newImage.path,
      },
      { new: true } 
    );
    const loggedInUser = {
      user_id: updatedUser._id,
      userName: updatedUser.userName,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      imageName: updatedUser.imageName,
      userType: updatedUser.userType,
    };

    const token = jwt.sign(loggedInUser, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('loggedInUser', token, {
      httpOnly: true,
      secure: false, 
      maxAge: 30 * 24 * 60 * 60 * 1000, 
    });
    res.json({
      message: 'Image replaced and database updated successfully',
      newImageUrl: newImage.path,
      newImagePublicId: newImage.filename,
    });
  } catch (error) {
    console.error('Error replacing image and updating database:', error);
    res.status(500).json({ error: 'Failed to replace image and update database' });
  }
});



  




module.exports = router;