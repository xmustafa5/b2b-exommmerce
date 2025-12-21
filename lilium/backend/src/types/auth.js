"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = exports.refreshTokenSchema = exports.resetPasswordSchema = exports.requestPasswordResetSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// Login schema - Used for both dashboard and mobile login
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string(),
});
// Password reset schema
exports.requestPasswordResetSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
// Refresh token schema
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
// Update password schema
exports.updatePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
//# sourceMappingURL=auth.js.map