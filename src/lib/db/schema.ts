import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum, date, uniqueIndex } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['admin', 'collaborator'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('collaborator'),
  color: text('color'),
  tenantId: uuid('tenant_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  duration: integer('duration').notNull(),
  durationSurchargePer30min: integer('duration_surcharge_per_30min').notNull().default(0),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const stations = pgTable('stations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  locationId: uuid('location_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  allowedSizes: text('allowed_sizes').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const stationServices = pgTable('station_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  stationId: uuid('station_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})


export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  nominativo: text('nominativo').notNull(),
  phone: text('phone').notNull(),
  owner2: text('owner2'),
  phone2: text('phone2'),
  owner3: text('owner3'),
  phone3: text('phone3'),
  email: text('email'),
  consentGivenAt: timestamp('consent_given_at').notNull(),
  consentVersion: text('consent_version').notNull().default('1.0'),
  deletedAt: timestamp('deleted_at'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const clientNotes = pgTable('client_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// CC-2026-04-26b: Catalogo razze canine — CMS gestito dall'Amministratore.
export const breeds = pgTable('breeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  coatType: text('coat_type'),
  sizeType: text('size_type'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const dogs = pgTable('dogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  breedId: uuid('breed_id').references(() => breeds.id, { onDelete: 'set null' }),
  size: text('size'),
  coatType: text('coat_type'),
  sizeType: text('size_type'),
  dateOfBirth: timestamp('date_of_birth'),
  sex: text('sex'),
  sterilized: boolean('sterilized').notNull().default(false),
  clientId: uuid('client_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const dogNotes = pgTable('dog_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  dogId: uuid('dog_id').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userLocationAssignments = pgTable('user_location_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  locationId: uuid('location_id').notNull(),
  date: date('date').notNull(), // YYYY-MM-DD — data specifica di calendario (CC-2026-04-26)
  startTime: text('start_time').notNull(), // "HH:mm"
  endTime: text('end_time').notNull(), // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userRecurringSchedules = pgTable('user_recurring_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedì (ISO getISODay-1), 6=Domenica
  startTime: text('start_time').notNull(), // "HH:mm"
  endTime: text('end_time').notNull(), // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('urs_user_dow_start_tenant_idx').on(table.userId, table.dayOfWeek, table.startTime, table.tenantId)
])

export const locationBusinessHours = pgTable('location_business_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Lunedi' (ISO 8601), 6=Domenica
  openTime: text('open_time').notNull(),   // "HH:mm"
  closeTime: text('close_time').notNull(), // "HH:mm"
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const servicePriceMatrix = pgTable('service_price_matrix', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  coatType: text('coat_type').notNull(),
  sizeType: text('size_type').notNull(),
  price: integer('price').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => [uniqueIndex('unique_service_matrix_cell').on(t.serviceId, t.coatType, t.sizeType, t.tenantId)]
)

export const pricingSurcharges = pgTable('pricing_surcharges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  dimension: text('dimension').notNull(),
  valueKey: text('value_key').notNull(),
  surchargePercent: integer('surcharge_percent').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
},
(t) => [uniqueIndex('unique_surcharge_key').on(t.tenantId, t.dimension, t.valueKey)]
)

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(),
  dogId: uuid('dog_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  userId: uuid('user_id'), // opzionale: se assente, l'appuntamento è "da assegnare" e vive sulla postazione
  stationId: uuid('station_id'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  price: integer('price').notNull(),
  notes: text('notes'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // in centesimi
  stock: integer('stock').notNull().default(0),
  deletedAt: timestamp('deleted_at'),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const appointmentProducts = pgTable('appointment_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull().default(1),
  priceAtSale: integer('price_at_sale').notNull(), // snapshot prezzo al momento della vendita
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
