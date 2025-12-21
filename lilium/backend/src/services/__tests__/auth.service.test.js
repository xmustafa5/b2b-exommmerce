"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_service_1 = require("../auth.service");
const client_1 = require("@prisma/client");
describe('AuthService', () => {
    let authService;
    let mockFastify;
    beforeEach(() => {
        // Mock Fastify instance
        mockFastify = {
            prisma: {
                user: {
                    findUnique: jest.fn(),
                    findFirst: jest.fn(),
                    create: jest.fn(),
                    update: jest.fn(),
                },
                address: {
                    create: jest.fn(),
                },
            },
            jwt: {
                sign: jest.fn().mockReturnValue('mock-token'),
                verify: jest.fn(),
            },
            httpErrors: {
                conflict: jest.fn().mockImplementation((msg) => new Error(msg)),
                unauthorized: jest.fn().mockImplementation((msg) => new Error(msg)),
                forbidden: jest.fn().mockImplementation((msg) => new Error(msg)),
                notFound: jest.fn().mockImplementation((msg) => new Error(msg)),
                badRequest: jest.fn().mockImplementation((msg) => new Error(msg)),
            },
            log: {
                info: jest.fn(),
                error: jest.fn(),
            },
        };
        authService = new auth_service_1.AuthService(mockFastify);
    });
    describe('register', () => {
        it('should register a new user successfully', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                name: 'Test User',
                role: client_1.UserRole.SHOP_OWNER,
                zones: [client_1.Zone.KARKH],
                createdAt: new Date(),
            };
            mockFastify.prisma.user.findUnique.mockResolvedValue(null);
            mockFastify.prisma.user.create.mockResolvedValue(mockUser);
            mockFastify.prisma.user.update.mockResolvedValue(mockUser);
            const result = await authService.register({
                email: 'test@example.com',
                password: 'Test@1234',
                name: 'Test User',
                role: client_1.UserRole.SHOP_OWNER,
                zones: [client_1.Zone.KARKH],
            });
            expect(result.user).toEqual(mockUser);
            expect(result.tokens).toHaveProperty('accessToken');
            expect(result.tokens).toHaveProperty('refreshToken');
        });
        it('should throw conflict error if user already exists', async () => {
            mockFastify.prisma.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: 'test@example.com',
            });
            await expect(authService.register({
                email: 'test@example.com',
                password: 'Test@1234',
                name: 'Test User',
                role: client_1.UserRole.SHOP_OWNER,
            })).rejects.toThrow('User with this email already exists');
        });
    });
    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const hashedPassword = await bcrypt_1.default.hash('Test@1234', 10);
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                password: hashedPassword,
                name: 'Test User',
                role: client_1.UserRole.SHOP_OWNER,
                zones: [client_1.Zone.KARKH],
                isActive: true,
            };
            mockFastify.prisma.user.findUnique.mockResolvedValue(mockUser);
            mockFastify.prisma.user.update.mockResolvedValue(mockUser);
            const result = await authService.login({
                email: 'test@example.com',
                password: 'Test@1234',
            });
            expect(result.user.email).toBe('test@example.com');
            expect(result.tokens).toHaveProperty('accessToken');
            expect(result.tokens).toHaveProperty('refreshToken');
        });
        it('should throw unauthorized error for invalid password', async () => {
            const hashedPassword = await bcrypt_1.default.hash('Test@1234', 10);
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: true,
            };
            mockFastify.prisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(authService.login({
                email: 'test@example.com',
                password: 'WrongPassword',
            })).rejects.toThrow('Invalid email or password');
        });
        it('should throw forbidden error for inactive user', async () => {
            const hashedPassword = await bcrypt_1.default.hash('Test@1234', 10);
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                password: hashedPassword,
                isActive: false,
            };
            mockFastify.prisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(authService.login({
                email: 'test@example.com',
                password: 'Test@1234',
            })).rejects.toThrow('Account is deactivated');
        });
    });
    describe('sendOtp', () => {
        it('should send OTP to valid phone number', async () => {
            const mockUser = {
                id: 'user-id',
                phone: '+9647701234567',
            };
            mockFastify.prisma.user.findUnique.mockResolvedValue(mockUser);
            mockFastify.prisma.user.update.mockResolvedValue(mockUser);
            await authService.sendOtp('+9647701234567');
            expect(mockFastify.prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-id' },
                data: expect.objectContaining({
                    otpCode: expect.any(String),
                    otpExpiry: expect.any(Date),
                }),
            });
        });
        it('should throw not found error for non-existent phone', async () => {
            mockFastify.prisma.user.findUnique.mockResolvedValue(null);
            await expect(authService.sendOtp('+9647701234567')).rejects.toThrow('User with this phone number not found');
        });
    });
    describe('refreshToken', () => {
        it('should refresh token successfully', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                role: client_1.UserRole.SHOP_OWNER,
                zones: [client_1.Zone.KARKH],
                refreshToken: 'valid-refresh-token',
                isActive: true,
            };
            mockFastify.jwt.verify.mockReturnValue({
                userId: 'user-id',
                email: 'test@example.com',
                role: client_1.UserRole.SHOP_OWNER,
                zones: [client_1.Zone.KARKH],
            });
            mockFastify.prisma.user.findUnique.mockResolvedValue(mockUser);
            mockFastify.prisma.user.update.mockResolvedValue(mockUser);
            const result = await authService.refreshToken('valid-refresh-token');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
        });
        it('should throw unauthorized error for invalid refresh token', async () => {
            mockFastify.jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
        });
    });
    describe('updatePassword', () => {
        it('should update password successfully', async () => {
            const hashedPassword = await bcrypt_1.default.hash('OldPassword@123', 10);
            const mockUser = {
                id: 'user-id',
                password: hashedPassword,
            };
            mockFastify.prisma.user.findUnique.mockResolvedValue(mockUser);
            mockFastify.prisma.user.update.mockResolvedValue(mockUser);
            await authService.updatePassword('user-id', {
                currentPassword: 'OldPassword@123',
                newPassword: 'NewPassword@123',
            });
            expect(mockFastify.prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-id' },
                data: expect.objectContaining({
                    password: expect.any(String),
                }),
            });
        });
        it('should throw error for incorrect current password', async () => {
            const hashedPassword = await bcrypt_1.default.hash('OldPassword@123', 10);
            const mockUser = {
                id: 'user-id',
                password: hashedPassword,
            };
            mockFastify.prisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(authService.updatePassword('user-id', {
                currentPassword: 'WrongPassword',
                newPassword: 'NewPassword@123',
            })).rejects.toThrow('Current password is incorrect');
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map