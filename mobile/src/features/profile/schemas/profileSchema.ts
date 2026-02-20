import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(6, 'Phone number is required').optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
