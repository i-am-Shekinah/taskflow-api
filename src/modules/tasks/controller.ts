import { Types } from 'mongoose';
import { Request, Response } from 'express';
import { ITask, Task } from '../../models/task';
import { HttpError } from '../../errors';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
} from './schemas';

function formatTask(task: ITask) {
  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const query = listTasksQuerySchema.parse(req.query);

  const filter: Record<string, unknown> = { owner: new Types.ObjectId(req.userId) };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  const [total, tasks] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter)
      .sort(query.sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
  ]);

  res.json({
    data: tasks.map(formatTask),
    page: query.page,
    limit: query.limit,
    total,
  });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const input = createTaskSchema.parse(req.body);
  const task = await Task.create({ ...input, owner: new Types.ObjectId(req.userId) });
  res.status(201).json({ data: formatTask(task.toObject()) });
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamSchema.parse(req.params);
  const task = await Task.findOne({ _id: id, owner: new Types.ObjectId(req.userId) }).lean();
  if (!task) throw new HttpError(404, 'task_not_found', 'Task not found');
  res.json({ data: formatTask(task) });
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamSchema.parse(req.params);
  const input = updateTaskSchema.parse(req.body);

  const task = await Task.findOneAndUpdate(
    { _id: id, owner: new Types.ObjectId(req.userId) },
    { $set: input },
    { returnDocument: 'after' }
  );
  if (!task) throw new HttpError(404, 'task_not_found', 'Task not found');
  res.json({ data: formatTask(task.toObject()) });
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamSchema.parse(req.params);
  const task = await Task.findOneAndDelete({ _id: id, owner: new Types.ObjectId(req.userId) });
  if (!task) throw new HttpError(404, 'task_not_found', 'Task not found');
  res.status(204).send();
}
