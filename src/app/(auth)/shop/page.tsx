import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getProducts } from '@/lib/queries/products'
import { ProductList } from '@/components/shop/ProductList'

export default async function ShopPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/login')
  if (session.user.role !== 'admin') redirect('/agenda')

  const productsList = await getProducts(session.user.tenantId)

  return <ProductList products={productsList} />
}
