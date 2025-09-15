const mongoose = require('mongoose');
const User = require('./models/User');
const Video = require('./models/Video');

async function createTestVideo() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports-talent-platform');
    console.log('Connected to MongoDB');

    // Find or create a test athlete user
    let athlete = await User.findOne({ email: 'test.athlete@example.com' });
    if (!athlete) {
      athlete = new User({
        name: 'Test Athlete',
        email: 'test.athlete@example.com',
        password: 'hashedpassword123',
        userType: 'athlete',
        sport: 'athletics',
        city: 'Delhi',
        state: 'Delhi',
        address: 'Test Address, Delhi',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Delhi coordinates
        }
      });
      await athlete.save();
      console.log('Created test athlete user');
    }

    // Create a test video with a placeholder video file
    const testVideo = new Video({
      title: 'Test Training Video',
      description: 'A sample training video for testing video playback functionality',
      uploadedBy: athlete._id,
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', // Sample video URL
      thumbnailUrl: 'https://via.placeholder.com/320x240/000000/FFFFFF?text=Video+Thumbnail',
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
        address: 'Test Address, Delhi'
      },
      shareRadius: 50,
      tags: ['training', 'athletics', 'test'],
      duration: 30,
      views: 5,
      likes: 2,
      comments: []
    });

    await testVideo.save();
    console.log('Created test video:', testVideo._id);
    console.log('Video URL:', testVideo.videoUrl);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test video:', error);
    process.exit(1);
  }
}

createTestVideo();
