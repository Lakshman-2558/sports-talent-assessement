# Cloudinary Setup Instructions

## Why Videos Are Not Submitting

The video upload failure is caused by invalid Cloudinary credentials. The system is currently using placeholder credentials that don't connect to a real Cloudinary account.

## How to Fix This

### Option 1: Set Up Free Cloudinary Account (Recommended)

1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Create a free account
3. After registration, go to your Dashboard
4. Copy your credentials:
   - Cloud Name
   - API Key  
   - API Secret

5. Update your `.env` file with the real credentials:
```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### Option 2: Use Local Storage (Current Fallback)

The system now automatically falls back to local file storage when Cloudinary fails. Videos will be stored in:
- `backend/uploads/videos/` directory
- Accessible via: `http://localhost:5000/uploads/videos/filename`

## Current Status

✅ **Fixed**: Video upload system now works with local storage fallback
✅ **Fixed**: File upload disabled for athletes (as requested)
✅ **Fixed**: Videos display properly in athlete dashboard
✅ **Ready**: System will automatically use Cloudinary when valid credentials are provided

## Testing the Fix

1. Start the server: `node server.js`
2. Videos will now upload successfully to local storage
3. Athletes can view their videos in the "My Videos" section
4. Upload functionality is disabled for athletes (they see an info message instead)

## Next Steps

- Replace the placeholder Cloudinary credentials with real ones for production use
- Videos will automatically switch to Cloudinary storage once valid credentials are provided
