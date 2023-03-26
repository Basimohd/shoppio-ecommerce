const multer=require('multer')
const path=require('path')


let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,path.join(__dirname,'../public/productImage'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname 
      cb(null, name)
    }
})

const fileFilter = function (req, file, cb) {
  // check if file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('File type not supported!'), false);
  }
  cb(null, true);
}

let upload = multer({ storage: storage,fileFilter:fileFilter })
module.exports={upload}