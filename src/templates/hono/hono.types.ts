export default `
{{typesImports}}

{{schema}}
{{createSchema}}

{{type}}
{{createType}}
`;

/*
 * This value is used to generate the types when the user does not select a validator or the validator does't have any type related configs
 */
export const fallback = `
export type {{Entity}} = {
  id: string;
}
export type create{{Entity}} = Omit<{{Entity}}, 'id'>;
`;
