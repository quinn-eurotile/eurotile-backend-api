const fs = require('fs').promises;
const path = require('path');

const saveFiles = async (req, res, next) => {
  if (!req.files) return next();
  
  const uploadPath = 'uploads/';
  
  try {
    // Ensure upload directory exists
    await fs.mkdir(uploadPath, { recursive: true });
    
    // Process each file field
    for (const [fieldName, files] of Object.entries(req.files)) {
      for (const file of files) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + '-' + file.originalname;
        const filepath = path.join(uploadPath, filename);
        
        // Save the file
        await fs.writeFile(filepath, file.buffer);
        
        // Add the path to the file object
        file.path = filepath;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { saveFiles };