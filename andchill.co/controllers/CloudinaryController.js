// Include the required node modules.
var cloudinary = require('cloudinary');
var http = require("http");


// Constructor of the Controller with default properties.
function CloudinaryController(){
  this.CLOUD_NAME = "dvjolz0dm";
  this.CLOUD_API_KEY = "742555622345846";
  this.API_SECRET = "d8mSGy1g-nxHMdE3ql9SN2mzy0Y";
  this.init();
}

// Initialize the cloudinary library.
CloudinaryController.prototype.init = function(){
  this.cloudinaryConfigData = {
    cloud_name: this.CLOUD_NAME,
    api_key: this.CLOUD_API_KEY,
    api_secret: this.API_SECRET
  };
  cloudinary.config(this.cloudinaryConfigData);
};

// Call the library method to upload image to cloudinary.com.
CloudinaryController.prototype.uploadImageToCloudinary = function(imagedata, resp){
    cloudinary.uploader.upload(
        imagedata.path,
        function(result) {
            return resp(result);
        },
        {
            crop: 'imagga_crop',
            width: 400,
            height: 400
        }
    );
};

// Export the controller.
module.exports = {'CloudinaryController' : new CloudinaryController() };