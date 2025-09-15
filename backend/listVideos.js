const mongoose = require('mongoose');
const Video = require('./models/Video');

async function listVideos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports-talent-db');
    console.log('Connected to MongoDB');

    const videos = await Video.find({}).select('_id title videoUrl uploadedBy sport visibility status');
    
    if (videos.length === 0) {
      console.log('No videos found in database');
    } else {
      console.log(`\nFound ${videos.length} videos:`);
      videos.forEach((video, index) => {
        console.log(`\n--- Video ${index + 1} ---`);
        console.log(`ID: ${video._id}`);
        console.log(`Title: ${video.title}`);
        console.log(`Video URL: ${video.videoUrl}`);
        console.log(`Sport: ${video.sport}`);
        console.log(`Visibility: ${video.visibility}`);
        console.log(`Status: ${video.status}`);
        console.log(`Stream URL: http://localhost:5000/api/videos/${video._id}/stream`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listVideos();
