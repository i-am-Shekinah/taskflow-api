import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../models/task';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid task id');

export const taskIdParamSchema = z.object({ id: objectId });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    description: z.string().trim().max(5000),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    dueDate: z.coerce.date(),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field is required' });

export const listTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', '-createdAt', 'dueDate', '-dueDate']).default('-createdAt'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
