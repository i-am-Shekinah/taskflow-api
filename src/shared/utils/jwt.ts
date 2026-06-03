import jwt from 'jsonwebtoken';

export const generateToken = (userId: string, role: string): string => {
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign({ userId, role }, secretKey, { expiresIn: '1h' });
};