export default `
{{typesImports}}

{{schema}}
{{createSchema}}

{{type}}
{{createType}}
`;

export const fallback = `
export type {{Entity}} = {
  id: string;
}
export type create{{Entity}} = Omit<{{Entity}}, 'id'>;
`;
