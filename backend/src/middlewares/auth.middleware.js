import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado o formato invÃ¡lido' });
        }

        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crediruta_secret_key_2026');
        
        // Inyectamos los datos del usuario en la peticiÃ³n para uso futuro
        req.user = decoded;
        
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invÃ¡lido o expirado' });
    }
};

export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            return res.status(401).json({ message: 'Usuario no autenticado o sin rol definido' });
        }

        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ 
                message: 'Acceso denegado: El perfil actual no tiene privilegios para este recurso' 
            });
        }

        next();
    };
};
