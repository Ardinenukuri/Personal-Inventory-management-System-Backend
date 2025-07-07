import { Request } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; 
import sendEmail from '../utils/email';
import { UserRegistrationData } from '../types/user.types';

export const AuthService = {
    register: async (userData: UserRegistrationData, req: Request) => {
        const { username, firstName, lastName, email, password } = userData;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const hashedVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');


        const { rows } = await pool.query(
            'INSERT INTO users (username, first_name, last_name, email, password_hash, verification_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, username',
            [username, firstName, lastName, email, passwordHash, hashedVerificationToken]
        );
        const user = rows[0];

        
        const verifyURL = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;

        const message = `
            <h1>Welcome to the Inventory System!</h1>
            <p>Thank you for registering. Please verify your email by clicking the link below:</p>
            <a href="${verifyURL}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px;">Verify Your Email</a>
            <p>If you cannot click the link, please copy and paste this URL into your browser:</p>
            <p>${verifyURL}</p>
            <p>This link will be valid for a limited time.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Email Verification - Inventory System',
            text: `Please verify your email by visiting this URL: ${verifyURL}`,
            html: message,
        });

        return user;
    },

    verifyEmail: async (token: string) => {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    
        const { rows } = await pool.query(
            'SELECT id FROM users WHERE verification_token = $1',
            [hashedToken]
        );

        if (rows.length === 0) {
            return null; 
        }
        const user = rows[0];

        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
            [user.id]
        );
        
        return user;
    },

    login: async (loginData: any) => {
        const { username, password } = loginData;

        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (rows.length === 0) {
            return null; 
        }
        const user = rows[0];

        // --- SECURITY CHECK ---
  if (user.status === 'disabled') {
    throw new Error('Your account has been disabled. Please contact support.');
  }
  if (user.status === 'pending') {
    throw new Error('Your account is pending. Please check your email to complete registration.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return null;


        if (!user.is_verified) {
            const err = new Error('Please verify your email before logging in.');
            err.name = 'EmailNotVerified';
            throw err;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordMatch) {
            return null; 
        }

        const payload = {
            id: user.id, 
            role: user.role
        };

        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET!, 
            { expiresIn: '1d' } 
        );

    
        return { 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
            } 
        };
    },

    forgotPassword: async (email: string, req: Request) => {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return true;
        }
        const user = rows[0];

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
            
        const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); 
        await pool.query(
            'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
            [hashedResetToken, resetTokenExpires, user.id]
        );

        const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        const message = `
            <h1>You requested a password reset</h1>
            <p>A request was made to reset the password for your account. Please click the link below to set a new password:</p>
            <a href="${resetURL}" style="background-color: #f44336; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px;">Reset Your Password</a>
            <p>This link is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request - Inventory System',
            text: `To reset your password, visit this URL: ${resetURL}`,
            html: message,
        });
        
        return true;
    },


    resetPassword: async (token: string, newPassword: string) => {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const { rows } = await pool.query(
            'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
            [hashedToken]
        );

        if (rows.length === 0) {
            return { success: false, message: 'Token is invalid or has expired.' };
        }
        const user = rows[0];

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
    
        await pool.query(
            'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
            [passwordHash, user.id]
        );

        return { success: true, message: 'Password has been reset successfully.' };
    },

     changePassword: async (userId: number, passwordData: any) => {
        const { previousPassword, newPassword } = passwordData;

        const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        
        if (rows.length === 0) {
            return { success: false, message: 'User not found.' };
        }
        const user = rows[0];
        
        const isMatch = await bcrypt.compare(previousPassword, user.password_hash);
        if (!isMatch) {
            return { success: false, message: 'Incorrect previous password.' };
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

        return { success: true, message: 'Password changed successfully.' };
    },

     getProfile: async (userId: number) => {
        const { rows } = await pool.query(
            'SELECT id, username, email, first_name, last_name, image_url, role, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (rows.length === 0) {
            return null;
        }
        
        return rows[0];
    },

    updateProfile: async (userId: number, profileData: any) => {
        const { username, first_name, last_name, email, image_url } = profileData;

        const { rows: existingUserRows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (existingUserRows.length === 0) {
            throw new Error('User not found'); 
        }
        const existingUser = existingUserRows[0];

        const updatedUser = {
            username: username || existingUser.username,
            first_name: first_name || existingUser.first_name,
            last_name: last_name || existingUser.last_name,
            email: email || existingUser.email,
            image_url: image_url || existingUser.image_url,
        };

        const { rows } = await pool.query(
            `UPDATE users SET 
                username = $1, 
                first_name = $2, 
                last_name = $3, 
                email = $4,
                image_url = $5
             WHERE id = $6 
             RETURNING id, username, email, first_name, last_name, image_url`,
            [
                updatedUser.username,
                updatedUser.first_name,
                updatedUser.last_name,
                updatedUser.email,
                updatedUser.image_url,
                userId
            ]
        );

        return rows[0];
    },

    completeRegistration: async (token: string, userData: any) => {
        const { username, firstName, lastName, password } = userData;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE verification_token = $1 AND is_verified = FALSE',
            [hashedToken]
        );

        if (rows.length === 0) {
            return { success: false, message: 'Invitation token is invalid or has already been used.' };
        }
        const user = rows[0];

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const { rows: updatedRows } = await pool.query(
    `UPDATE users SET 
        username = $1, first_name = $2, last_name = $3, password_hash = $4,
        is_verified = TRUE, verification_token = NULL,
        status = 'active' -- Set status to active upon completion
     WHERE id = $5
     RETURNING id, username, email`,
    [username, firstName, lastName, passwordHash, user.id]
  );
  return { success: true, user: updatedRows[0] };
    },

    inviteUser: async (email: string, req: Request) => { 
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(invitationToken).digest('hex');

        const { rows } = await pool.query(
            'INSERT INTO users (email, verification_token) VALUES ($1, $2) RETURNING *',
            [email, hashedToken, , 'pending']
        );
        const newUser = rows[0];

        const completeRegistrationURL = `${process.env.FRONTED_URL || 'http://localhost:3000'}/complete-registration/${invitationToken}`;

        const message = `
            <h1>You've been invited!</h1>
            <p>You have been invited to join the Inventory Management Platform. Please click the link below to complete your registration and set your password:</p>
            <a href="${completeRegistrationURL}" style="background-color: #008CBA; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px;">Complete Your Registration</a>
            <p>This link is valid for a limited time.</p>
        `;

        await sendEmail({
            to: newUser.email,
            subject: 'Invitation to Join the Inventory Platform',
            text: `Complete your registration by visiting this URL: ${completeRegistrationURL}`,
            html: message,
        });

        return newUser;
    },



};
