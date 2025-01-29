import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const entitySchema = z.object({
  id: z.string().uuid(),
});
const createEntitySchema = entitySchema.omit({ id: true });

export type Entity = z.infer<typeof entitySchema>;
export type CreateEntity = z.infer<typeof createEntitySchema>;

export const entityRouter = new Hono()
  .get('/entities', async (c) => {
    // Logic to get all entities
    return c.json({ message: 'Get all entities' });
  })
  .post('/entities', zValidator('json', createEntitySchema), async (c) => {
    const entity = c.req.valid('json');
    // Logic to create a new entity
    return c.json({ message: 'Entity created', entity });
  })
  .get(
    '/entities/:id',
    zValidator('param', entitySchema.pick({ id: true })),
    async (c) => {
      const { id } = c.req.valid('param');
      // Logic to get an entity by id
      return c.json({ message: `Get entity with id ${id}` });
    },
  )
  .put('/entities/:id', zValidator('json', entitySchema), async (c) => {
    const entity = c.req.valid('json');
    // Logic to update an entity by id
    return c.json({ message: `Entity with id ${entity.id} updated`, entity });
  })
  .delete(
    '/entities/:id',
    zValidator('param', entitySchema.pick({ id: true })),
    async (c) => {
      const { id } = c.req.valid('param');
      // Logic to delete an entity by id
      return c.json({ message: `Entity with id ${id} deleted` });
    },
  )
  .patch(
    '/entities/:id',
    zValidator(
      'json',
      entitySchema
        .pick({ id: true })
        .merge(entitySchema.omit({ id: true }).partial()),
    ),
    async (c) => {
      const entity = c.req.valid('json');
      // Logic to partially update an entity by id
      return c.json({
        message: `Entity with id ${entity.id} partially updated`,
        entity,
      });
    },
  );
