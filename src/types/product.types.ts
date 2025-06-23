import { z } from 'zod';
import { createProductSchema } from '../schemas/product.schema';

export type ProductCreationData = z.infer<typeof createProductSchema>['body'];