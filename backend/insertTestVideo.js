const mongoose = require('mongoose');
const Video = require('./models/Video');
const User = require('./models/User');

async function insertTestVideos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports-talent-platform');
    console.log('Connected to MongoDB');

    // Find or create test users
    let athlete1 = await User.findOne({ email: 'athlete1@example.com' });
    if (!athlete1) {
      athlete1 = new User({
        name: 'John Athlete',
        email: 'athlete1@example.com',
        password: '$2a$10$dummy.hash.for.testing',
        userType: 'athlete',
        sport: 'athletics',
        city: 'Delhi',
        state: 'Delhi'
      });
      await athlete1.save();
      console.log('Created athlete1 user');
    }

    let athlete2 = await User.findOne({ email: 'athlete2@example.com' });
    if (!athlete2) {
      athlete2 = new User({
        name: 'Sarah Runner',
        email: 'athlete2@example.com',
        password: '$2a$10$dummy.hash.for.testing',
        userType: 'athlete',
        sport: 'athletics',
        city: 'Mumbai',
        state: 'Maharashtra'
      });
      await athlete2.save();
      console.log('Created athlete2 user');
    }

    // Create multiple test videos with different URLs
    const testVideos = [
      {
        title: 'Sprint Training Session',
        description: 'High-intensity sprint training for athletes',
        uploadedBy: athlete1._id,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://via.placeholder.com/320x240/FF0000/FFFFFF?text=Sprint',
        sport: 'athletics',
        category: 'training',
        skillLevel: 'intermediate',
        visibility: 'public',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139],
          city: 'Delhi',
          state: 'Delhi',
          address: 'Sports Complex, Delhi'
        },
        shareRadius: 50,
        tags: ['sprint', 'training', 'athletics'],
        duration: 596,
        views: 12,
        likes: 3
      },
      {
        title: 'Long Distance Running Technique',
        description: 'Proper form and breathing for long distance running',
        uploadedBy: athlete2._id,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://via.placeholder.com/320x240/00FF00/FFFFFF?text=Running',
        sport: 'athletics',
        category: 'technique',
        skillLevel: 'beginner',
        visibility: 'public',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760],
          city: 'Mumbai',
          state: 'Maharashtra',
          address: 'Marine Drive, Mumbai'
        },
        shareRadius: 75,
        tags: ['running', 'technique', 'endurance'],
        duration: 653,
        views: 8,
        likes: 5
      },
      {
        title: 'Football Skills Practice',
        description: 'Basic football dribbling and passing techniques',
        uploadedBy: athlete1._id,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://via.placeholder.com/320x240/0000FF/FFFFFF?text=Football',
        sport: 'football',
        category: 'training',
        skillLevel: 'intermediate',
        visibility: 'coaches_only',
        status: 'approved',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139],
          city: 'Delhi',
          state: 'Delhi',
          address: 'Football Ground, Delhi'
        },
        shareRadius: 30,
        tags: ['football', 'skills', 'dribbling'],
        duration: 15,
        views: 6,
        likes: 2
      }
    ];

    const savedVideos = [];
    for (const videoData of testVideos) {
      const video = new Video(videoData);
      const savedVideo = await video.save();
      savedVideos.push(savedVideo);
      console.log(`Created video: ${savedVideo.title} (ID: ${savedVideo._id})`);
    }

    console.log('\n=== Test Videos Created Successfully! ===');
    console.log(`Total videos created: ${savedVideos.length}`);
    console.log('\nTest streaming URLs:');
    savedVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}: http://localhost:5000/api/videos/${video._id}/stream`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

insertTestVideos();
