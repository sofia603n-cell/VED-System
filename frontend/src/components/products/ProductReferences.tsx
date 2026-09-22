import type { CatalogOption, Product } from '../../types'

interface ProductReferencesProps {
  references: CatalogOption[]
  products: Product[]
}

export function ProductReferences({ references, products }: ProductReferencesProps) {
  return <div className="table-card"><table><thead><tr><th>ID</th><th>Referencia</th><th>Velas asociadas</th><th>Stock total</th></tr></thead><tbody>{references.map((reference) => { const related = products.filter((product) => product.referenceId === reference.id || product.category === reference.name); const stockTotal = related.reduce((sum, product) => sum + product.stock, 0); return <tr key={reference.id}><td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-dim)' }}>#{reference.id}</span></td><td><strong>{reference.name}</strong></td><td>{related.length}</td><td>{stockTotal} unid.</td></tr> })}</tbody></table></div>
}
