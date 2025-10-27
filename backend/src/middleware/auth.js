const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Middleware para verificar permisos específicos
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    try {
      const permissions = req.user.permissions;
      
      if (!permissions) {
        return res.status(403).json({
          success: false,
          message: 'Permisos no encontrados'
        });
      }

      // Verificar si el usuario tiene permisos para el recurso y acción
      const hasPermission = permissions[resource] && permissions[resource][action];
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requieren permisos de ${action} en ${resource}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

// Middleware para administradores (mantener compatibilidad)
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  checkPermission
};

