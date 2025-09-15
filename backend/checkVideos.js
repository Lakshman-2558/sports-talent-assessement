const mongoose = require('mongoose');
const Video = require('./models/Video');

async function checkVideos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports-talent-platform');
    console.log('Connected to MongoDB');

    const videos = await Video.find().limit(10);
    console.log(`Found ${videos.length} videos in database:`);
    
    videos.forEach((video, index) => {
      console.log(`\n${index + 1}. Video ID: ${video._id}`);
      console.log(`   Title: ${video.title}`);
      console.log(`   Video URL: ${video.videoUrl}`);
      console.log(`   Uploaded by: ${video.uploadedBy}`);
      console.log(`   Sport: ${video.sport}`);
      console.log(`   Visibility: ${video.visibility}`);
      console.log(`   Status: ${video.status}`);
    });

    if (videos.length === 0) {
      console.log('\nNo videos found in database. This explains why the fallback video was being used.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVideos();
