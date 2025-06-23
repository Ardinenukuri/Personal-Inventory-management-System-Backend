import { registerSchema } from '../schemas/auth.schema';
import { z } from 'zod';

export type UserRegistrationData = z.infer<typeof registerSchema>['body'];