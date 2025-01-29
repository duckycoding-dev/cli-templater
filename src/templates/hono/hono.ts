export default `
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const {{entity}}Schema = z.object({
  id: z.string().uuid(),
});
const create{{Entity}}Schema = {{entity}}Schema.omit({ id: true });

export type {{Entity}} = z.infer<typeof {{entity}}Schema>;
export type Create{{Entity}} = z.infer<typeof create{{Entity}}Schema>;

export const {{entity}}Router = new Hono()
  .get('/{{entities}}', async (c) => {
    // Logic to get all {{entities}}
    return c.json({ message: 'Get all {{entities}}' });
  })
  .post('/{{entities}}', zValidator('json', create{{Entity}}Schema), async (c) => {
    const {{entity}} = c.req.valid('json');
    // Logic to create a new {{entity}}
    return c.json({ message: '{{Entity}} created', {{entity}} });
  })
  .get(
    '/{{entities}}/:id',
    zValidator('param', {{entity}}Schema.pick({ id: true })),
    async (c) => {
      const { id } = c.req.valid('param');
      // Logic to get a {{entity}} by id
      return c.json({ message: \`Get {{entity}} with id \${id}\` });
    },
  )
  .put('/{{entities}}/:id', zValidator('json', {{entity}}Schema), async (c) => {
    const {{entity}} = c.req.valid('json');
    // Logic to update a {{entity}} by id
    return c.json({ message: \`{{Entity}} with id \${{{entity}}.id} updated\`, {{entity}} });
  })
  .delete(
    '/{{entities}}/:id',
    zValidator('param', {{entity}}Schema.pick({ id: true })),
    async (c) => {
      const { id } = c.req.valid('param');
      // Logic to delete a {{entity}} by id
      return c.json({ message: \`{{Entity}} with id \${id} deleted\` });
    },
  )
  .patch(
    '/{{entities}}/:id',
    zValidator(
      'json',
      {{entity}}Schema
        .pick({ id: true })
        .merge({{entity}}Schema.omit({ id: true }).partial()),
    ),
    async (c) => {
      const {{entity}} = c.req.valid('json');
      // Logic to partially update a {{entity}} by id
      return c.json({
        message: \`{{Entity}} with id \${{{entity}}.id} partially updated\`,
        {{entity}},
      });
    },
  );
`;
