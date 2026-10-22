import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

async function registerAndGetToken(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123' });
  return res.body.token as string;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe('task CRUD', () => {
  it('rejects unauthenticated access with 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token with 401', async () => {
    const token = await registerAndGetToken('tamper@example.com');
    const res = await request(app).get('/api/tasks').set(auth(`${token}x`));
    expect(res.status).toBe(401);
  });

  it('creates a task with defaults', async () => {
    const token = await registerAndGetToken('create@example.com');
    const res = await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({ title: 'Write MVP' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: 'Write MVP', status: 'todo', priority: 'medium' });
    expect(res.body.data.id).toMatch(/^[a-fA-F0-9]{24}$/);
  });

  it('rejects a task without a title with 400', async () => {
    const token = await registerAndGetToken('invalid@example.com');
    const res = await request(app).post('/api/tasks').set(auth(token)).send({ description: 'oops' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('lists, reads, updates and deletes a task', async () => {
    const token = await registerAndGetToken('flow@example.com');

    const created = await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({ title: 'Ship it', priority: 'high', dueDate: '2026-11-01' });
    const id = created.body.data.id as string;

    const list = await request(app).get('/api/tasks').set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(list.body.data).toHaveLength(1);

    const read = await request(app).get(`/api/tasks/${id}`).set(auth(token));
    expect(read.status).toBe(200);
    expect(read.body.data.title).toBe('Ship it');

    const patched = await request(app)
      .patch(`/api/tasks/${id}`)
      .set(auth(token))
      .send({ status: 'done' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.status).toBe('done');

    const removed = await request(app).delete(`/api/tasks/${id}`).set(auth(token));
    expect(removed.status).toBe(204);

    const afterDelete = await request(app).get(`/api/tasks/${id}`).set(auth(token));
    expect(afterDelete.status).toBe(404);
  });

  it('filters by status and paginates', async () => {
    const token = await registerAndGetToken('filter@example.com');
    for (const title of ['a', 'b', 'c']) {
      await request(app).post('/api/tasks').set(auth(token)).send({ title });
    }
    await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({ title: 'd', status: 'done' });

    const done = await request(app).get('/api/tasks?status=done').set(auth(token));
    expect(done.body.total).toBe(1);
    expect(done.body.data[0].title).toBe('d');

    const page2 = await request(app).get('/api/tasks?page=2&limit=2').set(auth(token));
    expect(page2.body.total).toBe(4);
    expect(page2.body.data).toHaveLength(2);
  });

  it('keeps tasks private between users', async () => {
    const alice = await registerAndGetToken('alice@example.com');
    const bob = await registerAndGetToken('bob@example.com');

    const created = await request(app)
      .post('/api/tasks')
      .set(auth(alice))
      .send({ title: 'secret' });
    const id = created.body.data.id as string;

    const bobRead = await request(app).get(`/api/tasks/${id}`).set(auth(bob));
    expect(bobRead.status).toBe(404);

    const bobList = await request(app).get('/api/tasks').set(auth(bob));
    expect(bobList.body.total).toBe(0);
  });

  it('rejects malformed ids with 400 and empty patches with 400', async () => {
    const token = await registerAndGetToken('edges@example.com');

    const badId = await request(app).get('/api/tasks/not-an-id').set(auth(token));
    expect(badId.status).toBe(400);

    const created = await request(app)
      .post('/api/tasks')
      .set(auth(token))
      .send({ title: 'patch me' });
    const emptyPatch = await request(app)
      .patch(`/api/tasks/${created.body.data.id}`)
      .set(auth(token))
      .send({});
    expect(emptyPatch.status).toBe(400);
  });
});
