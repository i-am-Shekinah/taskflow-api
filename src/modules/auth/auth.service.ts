import { prisma } from '../../lib/prisma.js';
import {
  comparePasswords,
  hashPassword,
} from '../../shared/utils/hash.js';
import { generateToken } from '../../shared/utils/jwt.js';
import {
  LoginDto,
  RegisterDto,
} from './auth.types.js';

export class AuthService {
    async register(registerDto: RegisterDto) {
        const { firstName, lastName, email, password } = registerDto;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
            },
        });

        const token = generateToken(user.userId, user.role);
        const { password: _, ...safeUser } = user;

        return { user: safeUser, token };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await prisma.user.findUnique({
            where: { email },
        });
        
        if (!user) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const token = generateToken(user.userId, user.role);
        const { password: _, ...safeUser } = user;

        return { user: safeUser, token };
    }
}