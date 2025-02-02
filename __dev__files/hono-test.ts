import { Hono } from 'hono';

export type Entity = {
  id: string;
};
export type createEntity = Omit<Entity, 'id'>;

export const entityRouter = new Hono()
  .get('/entities', async (c) => {
    return c.json({ message: 'Get all entities' });
  })
  .post('/entities', async (c) => {
    const entity = await c.req.json<Entity>();

    return c.json({ message: 'Entity created', entity });
  })
  .get('/entities/:id', async (c) => {
    const pathParams = c.req.param();

    return c.json({ message: `Get entity with id ${pathParams.id}` });
  })
  .put('/entities/:id', async (c) => {
    const entity = await c.req.json<Entity>();
    const pathParams = c.req.param();

    return c.json({
      message: `Entity with id ${pathParams.id} updated`,
      entity,
    });
  })
  .delete('/entities/:id', async (c) => {
    const pathParams = c.req.param();

    return c.json({ message: `Entity with id ${pathParams.id} deleted` });
  })
  .patch('/entities/:id', async (c) => {
    const pathParams = c.req.param();
    const entity = await c.req.json<Entity>();

    return c.json({
      message: `Entity with id ${pathParams.id} partially updated`,
      entity,
    });
  });
