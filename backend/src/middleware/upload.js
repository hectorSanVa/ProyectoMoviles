const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verificar configuración de Cloudinary
console.log('🔧 Configuración Cloudinary:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Configurado' : '❌ Faltante');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Configurado' : '❌ Faltante');

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const uploadDir = 'uploads/temp/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

// Middleware para subir a Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  console.log('🔍 Verificando archivo:', req.file ? 'Archivo encontrado' : 'No hay archivo');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Request file:', req.file);
  
  if (req.file) {
    console.log('📁 Archivo recibido:', req.file.filename, 'Tamaño:', req.file.size);
    try {
      console.log('📤 Subiendo a Cloudinary...');
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'pos-products',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      
      req.cloudinaryUrl = result.secure_url;
      req.cloudinaryPublicId = result.public_id;
      
      console.log('✅ Imagen subida exitosamente a Cloudinary:', result.secure_url);
      console.log('📊 Public ID:', result.public_id);
      
      // Eliminar archivo temporal
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error('❌ Error subiendo a Cloudinary:', error);
      console.error('❌ Detalles del error:', error.message);
      console.error('❌ Código de error:', error.http_code);
      
      // Eliminar archivo temporal en caso de error
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo temporal:', unlinkError);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error subiendo imagen a Cloudinary: ' + error.message
      });
    }
  } else {
    console.log('⚠️ No hay archivo para subir a Cloudinary');
  }
  next();
};

module.exports = { upload, uploadToCloudinary };
