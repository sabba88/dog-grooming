import { db } from '@/lib/db'
import { users, pricingSurcharges } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_SURCHARGES = [
  { dimension: 'coat', valueKey: 'short',  surchargePercent: 0  },
  { dimension: 'coat', valueKey: 'medium', surchargePercent: 20 },
  { dimension: 'coat', valueKey: 'long',   surchargePercent: 20 },
  { dimension: 'size', valueKey: 'toy',    surchargePercent: 0  },
  { dimension: 'size', valueKey: 'small',  surchargePercent: 0  },
  { dimension: 'size', valueKey: 'medium', surchargePercent: 20 },
  { dimension: 'size', valueKey: 'large',  surchargePercent: 40 },
  { dimension: 'size', valueKey: 'giant',  surchargePercent: 60 },
]

export async function seedPricingSurchargesForTenant(tenantId: string) {
  const rows = DEFAULT_SURCHARGES.map((s) => ({ ...s, tenantId }))
  await db
    .insert(pricingSurcharges)
    .values(rows)
    .onConflictDoNothing()
}

async function main() {
  const allTenants = await db
    .selectDistinct({ tenantId: users.tenantId })
    .from(users)

  console.log(`Seeding pricing_surcharges for ${allTenants.length} tenant(s)...`)

  for (const { tenantId } of allTenants) {
    await seedPricingSurchargesForTenant(tenantId)
    console.log(`  ✓ tenant ${tenantId}`)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
