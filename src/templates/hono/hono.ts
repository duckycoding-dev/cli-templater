export default `
import { Hono } from 'hono';
{{validatorImports}}
{{types}}

export const {{entity}}Router = new Hono()
  .get('/{{entities}}', async (c) => {
    // Logic to get all {{entities}}
    return c.json({ message: 'Get all {{entities}}' });
  })
  .post('/{{entities}}', {{validationBody}}, async (c) => {
    const {{entity}} = c.req.valid('json');
    // Logic to create a new {{entity}}
    return c.json({ message: '{{Entity}} created', {{entity}} });
  })
  .get(
    '/{{entities}}/:id',
    {{validationParams}},
    async (c) => {
      const queryParams = c.req.valid('param');
      // Logic to get a {{entity}} by id
      return c.json({ message: \`Get {{entity}} with id \${queryParams.id}\` });
    },
  )
  .put('/{{entities}}/:id',
  {{validationParams}},
  {{validationBody}},
  async (c) => {
    const {{entity}} = c.req.valid('json');
    const queryParams = c.req.valid('param');
    // Logic to update a {{entity}} by id
    return c.json({ message: \`{{Entity}} with id \${queryParams.id} updated\`, {{entity}} });
  })
  .delete(
    '/{{entities}}/:id',
    {{validationParams}},
    async (c) => {
      const queryParams = c.req.valid('param');
      // Logic to delete a {{entity}} by id
      return c.json({ message: \`{{Entity}} with id \${queryParams.id} deleted\` });
    },
  )
  .patch(
    '/{{entities}}/:id',
    {{validationParams}},
    {{validationBodyPATCH}},
    async (c) => {
      const queryParams = c.req.valid('param');
      const {{entity}} = c.req.valid('json');
      // Logic to partially update a {{entity}} by id
      return c.json({
        message: \`{{Entity}} with id \${queryParams.id} partially updated\`,
        {{entity}},
      });
    },
  );
`;
