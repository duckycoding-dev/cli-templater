export default `
import { Hono } from 'hono';
{{validatorImports}}
{{types}}

export const {{entity}}Router = new Hono()
  .get('/{{entities_}}', async (c) => {
    // Logic to get all {{entities}}
    return c.json({ message: 'Get all {{entities}}' });
  })
  .post('/{{entities_}}', {{validationBody}}, async (c) => {
    const {{entity}} {{parseEntityBody}}
    // Logic to create a new {{entity}}
    return c.json({ message: '{{Entity}} created', {{entity}} });
  })
  .get(
    '/{{entities_}}/:id',
    {{validationParams}},
    async (c) => {
      const {{parsePathParamsResult}}{{parsePathParams}}
      // Logic to get a {{entity}} by id
      return c.json({ message: \`Get {{entity}} with id \${{{parsePathParamsResult}}.id}\` });
    },
  )
  .put('/{{entities_}}/:id',
  {{validationParams}},
  {{validationBody}},
  async (c) => {
    const {{entity}} {{parseEntityBody}}
    const {{parsePathParamsResult}}{{parsePathParams}}
    // Logic to update a {{entity}} by id
    return c.json({ message: \`{{Entity}} with id \${{{parsePathParamsResult}}.id} updated\`, {{entity}} });
  })
  .delete(
    '/{{entities_}}/:id',
    {{validationParams}},
    async (c) => {
      const {{parsePathParamsResult}}{{parsePathParams}}
      // Logic to delete a {{entity}} by id
      return c.json({ message: \`{{Entity}} with id \${{{parsePathParamsResult}}.id} deleted\` });
    },
  )
  .patch(
    '/{{entities_}}/:id',
    {{validationParams}},
    {{validationBodyPATCH}},
    async (c) => {
      const {{parsePathParamsResult}}{{parsePathParams}}
      const {{entity}} {{parseEntityBody}}
      // Logic to partially update a {{entity}} by id
      return c.json({
        message: \`{{Entity}} with id \${{{parsePathParamsResult}}.id} partially updated\`,
        {{entity}},
      });
    },
  );
`;
