/**
 * Renders one or more Schema.org JSON-LD objects as <script type="application/ld+json"> tags.
 *
 * Usage:
 *   <JsonLd schema={buildDesignerSchema(data)} />
 *   <JsonLd schemas={[buildOrganizationSchema(), buildWebSiteSchema()]} />
 */
export interface JsonLdProps {
  schema?:  Record<string, unknown>;
  schemas?: Record<string, unknown>[];
}

export function JsonLd({ schema, schemas }: JsonLdProps) {
  const all = schemas || (schema ? [schema] : []);
  if (!all.length) return null;

  return (
    <>
      {all.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}

export default JsonLd;
