const cloudinary = require('./cloudinaryConfig')

function deleteResource(publicId) {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Error deleting resource:', error);
      } else {
        console.log('Delete result:', result);
      }
    });
  }

  module.exports = deleteResource