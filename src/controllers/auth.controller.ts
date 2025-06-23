import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { completeRegistrationSchema } from '../schemas/auth.schema';
import { ZodError } from 'zod';

export const AuthController = {
  
  registerUser: async (req: Request, res: Response) => {
    try {
        await AuthService.register(req.body, req);

        res.status(201).json({ 
            message: 'Registration successful! Please check your email to verify your account.' 
        });

    } catch (error: any) {
        if (error.code === '23505') {
            res.status(409).json({ message: 'Error: Username or email already exists.' });
            return; 
        }
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
  },

  verifyEmail: async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const user = await AuthService.verifyEmail(token);

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired verification token.' });
            return; 
        }
        
        res.status(200).send('<h1>Email Verified Successfully!</h1><p>You can now close this window and log in.</p>');

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Server error during email verification.' });
    }
  },
  

  loginUser: async (req: Request, res: Response) => {
        try {
            const result = await AuthService.login(req.body);

            if (!result) {
                res.status(401).json({ message: 'Invalid username or password.' });
                return; 
            }

            res.status(200).json(result);

        } catch (error: any) {
            if (error.name === 'EmailNotVerified') {
                res.status(403).json({ message: error.message });
                return; 
            }
            
            console.error(error);
            res.status(500).json({ message: 'Server error during login.' });
        }
    },
  
  forgotPassword: async (req: Request, res: Response) => {
        try {
            await AuthService.forgotPassword(req.body.email, req);


            res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Server error.' });
        }
    },


    resetPassword: async (req: Request, res: Response) => {
        const { newPassword } = req.body;
        const { token } = req.params;

        try {
            const result = await AuthService.resetPassword(token, newPassword);

            if (!result.success) {
                res.status(400).json({ message: result.message });
                return; 
            }

            res.status(200).json({ message: result.message });

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Server error.' });
        }
    },
  
  changePassword: async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Not authorized.' });
            return;
        }

        try {
            const result = await AuthService.changePassword(userId, req.body);

            if (!result.success) {
                res.status(400).json({ message: result.message });
                return;
            }

            res.status(200).json({ message: result.message });

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Server error while changing password.' });
        }
    },

  
  getProfile: async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        try {
            const profile = await AuthService.getProfile(userId);
            if (!profile) {
                res.status(404).json({ message: 'User profile not found.' });
                return;
            }
            res.status(200).json(profile);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error while fetching profile.' });
        }
    },

  updateProfile: async (req: Request, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        try {
            const updatedProfile = await AuthService.updateProfile(userId, req.body);
            res.status(200).json(updatedProfile);
        } catch (error: any) {
            if (error.code === '23505') {
                res.status(409).json({ message: 'Username or email is already in use.' });
                return;
            }
            console.error(error);
            res.status(500).json({ message: 'Server error while updating profile.' });
        }
    },

    completeRegistration: async (req: Request, res: Response) => {
        try {
            const parsedBody = completeRegistrationSchema.shape.body.parse(req.body);

            const { token } = req.params;
            const result = await AuthService.completeRegistration(token, parsedBody);
            
            if (!result.success) {
                res.status(400).json({ message: result.message });
                return; 
            }
            res.status(200).json({ message: 'Registration complete! You can now log in.', user: result.user });
        } catch (error: any) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    message: "Input validation failed",
                    errors: error.errors,
                });
                return; 
            }
            if (error.code === '23505') { 
                res.status(409).json({ message: 'This username is already taken. Please choose another.' });
                return;
            }
            res.status(500).json({ message: 'Error completing registration', error: error.message });
        }
    },

};