/**
 * The test data `npm run db:reset` loads after the migrations. Development
 * branches only (reset.ts checks).
 *
 * Test logins (password for all: "admin"), one per role:
 *   admin@vecora.app        admin        (the main admin, the app's own account)
 *   president@vecora.com    president
 *   treasurer@vecora.com    treasurer
 *   security@vecora.com     security
 *   maintenance@vecora.com  maintenance
 *
 * 10 residents (the 4 board members above + 6 without an account), phones
 * +523139612222 upward; the admin isn't one. 20 houses A1–D5, some empty, and
 * one resident without a house. Periods, with Y the current year:
 *
 *   Y-2, Y-1  back to back, a year of fees and expenses each at older rates
 *             (650 and 700 a month), so the report and the ledger have history
 *   Y         fees and expenses every month since January, requests in every
 *             status, two bookings
 *   Y+1       no period: a gap, so its days show disabled in the date pickers
 *   Y+2       a future period at a higher fee, with no movements yet
 *
 * One cross-period case: C1 (the tenant) misses December Y-2 and pays it with
 * January Y-1 on one receipt, at Y-1's rate and with both late fees.
 *
 * Every step runs as the board member who would do it in the app, through
 * the same services (src/lib/services), so createdBy and the activity log are
 * right. Each step gets a time of its own in the log, so the history reads
 * like 45 days of activity instead of one run.
 */
import { hashPassword } from 'better-auth/crypto'
import { addDays, addHours, addMinutes, format, startOfMonth, subDays, subHours, subMonths } from 'date-fns'
import { eq, sql } from 'drizzle-orm'
import { type AppRole, formatRoles } from '../../src/lib/auth/roles'
import { actorTransaction, type Database, type Transaction } from '../../src/lib/db/client'
import {
  accounts,
  amenities,
  maintenanceRequests,
  properties,
  propertyResidents,
  residents,
  securityRequests,
  settings,
  users,
} from '../../src/lib/db/schema'
import type { Actor } from '../../src/lib/services/actor'
import { createReservation } from '../../src/lib/services/presidency'
import { createResident } from '../../src/lib/services/registry'
import { createRequest, payRequest, rejectRequest } from '../../src/lib/services/requests'
import { createPeriod, createTransaction, recordFeePayment } from '../../src/lib/services/treasury'

// Fixed ids, so the data is the same after every reset.
const MAIN_ADMIN_ID = 'a0000000-0000-4000-8000-000000000001'

const BOARD = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    email: 'president@vecora.com',
    name: 'Ana López',
    role: 'president',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    email: 'treasurer@vecora.com',
    name: 'Luis Fernández',
    role: 'treasurer',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    email: 'security@vecora.com',
    name: 'María García',
    role: 'security',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    email: 'maintenance@vecora.com',
    name: 'Diego Martínez',
    role: 'maintenance',
  },
] as const satisfies ReadonlyArray<{ id: string; email: string; name: string; role: AppRole }>

const admin: Actor = { id: MAIN_ADMIN_ID, roles: ['admin'] }
const president: Actor = { id: BOARD[0].id, roles: ['president'] }
const treasurer: Actor = { id: BOARD[1].id, roles: ['treasurer'] }
const security: Actor = { id: BOARD[2].id, roles: ['security'] }
const maintenance: Actor = { id: BOARD[3].id, roles: ['maintenance'] }

function residentId(n: number) {
  return `d0000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

const RESIDENTS = [
  {
    id: residentId(1),
    firstName: 'Roberto',
    lastName: 'Salinas',
    email: 'roberto@example.com',
    notes: null,
    userId: null,
  },
  {
    id: residentId(2),
    firstName: 'Ana',
    lastName: 'López',
    email: 'president@vecora.com',
    notes: null,
    userId: BOARD[0].id,
  },
  {
    id: residentId(3),
    firstName: 'Luis',
    lastName: 'Fernández',
    email: 'treasurer@vecora.com',
    notes: null,
    userId: BOARD[1].id,
  },
  {
    id: residentId(4),
    firstName: 'María',
    lastName: 'García',
    email: 'security@vecora.com',
    notes: null,
    userId: BOARD[2].id,
  },
  {
    id: residentId(5),
    firstName: 'Diego',
    lastName: 'Martínez',
    email: 'maintenance@vecora.com',
    notes: 'Dueño de dos casas',
    userId: BOARD[3].id,
  },
  {
    id: residentId(6),
    firstName: 'Sofía',
    lastName: 'Rivera',
    email: null,
    notes: 'Pareja de María',
    userId: null,
  },
  {
    id: residentId(7),
    firstName: 'Carmen',
    lastName: 'Ortega',
    email: 'carmen@example.com',
    notes: 'Inquilina en C1',
    userId: null,
  },
  {
    id: residentId(8),
    firstName: 'Pablo',
    lastName: 'Ortega',
    email: null,
    notes: 'Hijo de Carmen',
    userId: null,
  },
  {
    id: residentId(9),
    firstName: 'Jorge',
    lastName: 'Herrera',
    email: 'jorge@example.com',
    notes: null,
    userId: null,
  },
  {
    id: residentId(10),
    firstName: 'Lucía',
    lastName: 'Navarro',
    email: null,
    notes: 'Aún sin casa asignada',
    userId: null,
  },
]

// Who lives or owns where; every other house is empty, and Lucía has none.
const LINKS = [
  ['A1', 1, 'owner'],
  ['A2', 2, 'owner'],
  ['A3', 3, 'owner'],
  ['A3', 9, 'owner'], // co-owners
  ['B1', 4, 'owner'],
  ['B1', 6, 'family'],
  ['B2', 5, 'owner'],
  ['C1', 5, 'owner'], // the landlord, who lives in B2
  ['C1', 7, 'tenant'],
  ['C1', 8, 'family'],
] as const

// The houses that pay every month: the day they pay and how. C1, the tenant,
// always pays after the 10th, so a late fee comes with each of its fees.
const PAYERS = [
  { number: 'B1', day: 2, method: 'transfer' },
  { number: 'A1', day: 3, method: 'cash' },
  { number: 'A2', day: 5, method: 'transfer' },
  { number: 'A3', day: 8, method: 'cash' },
  { number: 'B2', day: 9, method: 'cash' },
  { number: 'C1', day: 14, method: 'cash' },
] as const

// For the "Recibo CFE <month>" notes.
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function day(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Never before `floor`: the seeded activity stays inside the current period. */
function notBefore(date: Date, floor: Date): Date {
  if (date < floor) {
    return floor
  }
  return date
}

/**
 * Runs `run` as `actor`, then dates the activity log rows it wrote at `at`
 * (instead of now), so each step reads as its own moment.
 */
function step<T>(db: Database, actor: Actor, at: Date, run: (tx: Transaction) => Promise<T>): Promise<T> {
  return actorTransaction(db, actor.id, async (tx) => {
    const result = await run(tx)
    await tx.execute(
      sql`update audit_log set occurred_at = ${at.toISOString()} where txid = pg_current_xact_id()::text::bigint`,
    )
    return result
  })
}

/** A password for `userId`, as Better Auth stores it. */
async function credential(userId: string, password: string) {
  return { userId, accountId: userId, providerId: 'credential', password: await hashPassword(password) }
}

/**
 * The main admin, admin@vecora.app: the app's own account, which manages
 * the board from the start. `mustChangePassword` for a shared default
 * password, which the app makes it replace before anything else.
 */
export async function seedMainAdmin(
  db: Database,
  options: { password: string; mustChangePassword: boolean },
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: MAIN_ADMIN_ID,
      name: 'Vecora Admin',
      email: 'admin@vecora.app',
      emailVerified: true,
      role: 'admin',
      isMainAdmin: true,
      mustChangePassword: options.mustChangePassword,
    })
    await tx.insert(accounts).values(await credential(MAIN_ADMIN_ID, options.password))
  })
}

async function categoryId(tx: Transaction, name: string): Promise<string> {
  const category = await tx.query.transactionCategories.findFirst({ columns: { id: true }, where: { name } })
  if (!category) {
    throw new Error(`No category named ${name}`)
  }
  return category.id
}

async function houseId(tx: Transaction, number: string): Promise<string> {
  const house = await tx.query.properties.findFirst({ columns: { id: true }, where: { number } })
  if (!house) {
    throw new Error(`No house ${number}`)
  }
  return house.id
}

export async function seed(db: Database): Promise<void> {
  await seedMainAdmin(db, { password: 'admin', mustChangePassword: false })

  const now = new Date()
  const year = now.getFullYear()
  const yearStart = new Date(year, 0, 1)
  const thisMonth = startOfMonth(now)
  const prevMonth = notBefore(subMonths(thisMonth, 1), yearStart)
  let t = subDays(now, 45)

  // ---------------------------------------------------------------------------
  // the admin names the residential, then seats the board
  // ---------------------------------------------------------------------------
  await step(db, admin, t, async (tx) => {
    await tx
      .update(settings)
      .set({ residentialName: 'Loma Verde Coto 404', defaultLanguage: 'es', currency: 'MXN' })
  })
  t = addMinutes(t, 5)

  await step(db, admin, t, async (tx) => {
    for (const member of BOARD) {
      await tx.insert(users).values({
        id: member.id,
        name: member.name,
        email: member.email,
        emailVerified: true,
        role: formatRoles([member.role]),
      })
      await tx.insert(accounts).values(await credential(member.id, 'admin'))
    }
  })

  // ---------------------------------------------------------------------------
  // the president sets up the residential
  // ---------------------------------------------------------------------------
  t = addHours(t, 26)
  await step(db, president, t, async (tx) => {
    const numbers = ['A', 'B', 'C', 'D'].flatMap((block) => [1, 2, 3, 4, 5].map((n) => `${block}${n}`))
    await tx.insert(properties).values(numbers.map((number) => ({ number })))
  })

  t = addMinutes(t, 20)
  await step(db, president, t, async (tx) => {
    await tx.update(properties).set({ notes: 'Casa de esquina' }).where(eq(properties.number, 'A1'))
  })
  t = addMinutes(t, 5)
  await step(db, president, t, async (tx) => {
    await tx.update(properties).set({ notes: 'Rentada' }).where(eq(properties.number, 'C1'))
  })

  t = addHours(t, 25)
  // Board members are residents with an account; the admin is not one.
  await step(db, president, t, async (tx) => {
    for (const [index, resident] of RESIDENTS.entries()) {
      await createResident(tx, {
        id: resident.id,
        userId: resident.userId ?? undefined,
        firstName: resident.firstName,
        lastName: resident.lastName,
        phone: `+52313961${2222 + index}`,
        email: resident.email,
        notes: resident.notes,
        house: null,
      })
    }
  })

  t = addMinutes(t, 40)
  await step(db, president, t, async (tx) => {
    for (const [number, resident, relationship] of LINKS) {
      await tx
        .insert(propertyResidents)
        .values({ propertyId: await houseId(tx, number), residentId: residentId(resident), relationship })
    }
  })

  // ---------------------------------------------------------------------------
  // the treasurer opens the period and catches up with the paper book: each
  // paying house's fee, the gardener, the electricity bill and a few repairs,
  // so the dashboard chart has every month since January
  // ---------------------------------------------------------------------------
  t = addHours(t, 51)
  await step(db, treasurer, t, (tx) =>
    createPeriod(tx, {
      name: String(year),
      startsOn: day(yearStart),
      endsOn: `${year}-12-31`,
      monthlyFee: 800,
      lateFee: 100,
      dueDay: 10,
    }),
  )

  let folio = 0
  for (let month = yearStart; month < thisMonth; month = startOfMonth(addDays(month, 32))) {
    const monthNumber = month.getMonth() + 1

    for (const payer of PAYERS) {
      // A1 and B1 pay last month further down; C1 fell behind in July and August.
      if (month.getTime() === prevMonth.getTime() && (payer.number === 'A1' || payer.number === 'B1')) {
        continue
      }
      if (payer.number === 'C1' && (monthNumber === 7 || monthNumber === 8)) {
        continue
      }

      folio = folio + 1
      const receipt = String(folio).padStart(4, '0')
      t = addMinutes(t, 2)
      await step(db, treasurer, t, async (tx) => {
        await recordFeePayment(tx, treasurer, {
          propertyId: await houseId(tx, payer.number),
          feeMonths: [day(month)],
          occurredOn: day(addDays(month, payer.day - 1)),
          folio: receipt,
          paymentMethod: payer.method,
          reference: payer.method === 'transfer' ? `SPEI ${7700000 + folio}` : null,
          notes: null,
        })
      })
    }

    t = addMinutes(t, 2)
    await step(db, treasurer, t, async (tx) => {
      await createTransaction(tx, treasurer, {
        kind: 'expense',
        categoryId: await categoryId(tx, 'Jardinería'),
        amount: 1200,
        occurredOn: day(addDays(month, 4)),
        paymentMethod: 'cash',
        folio: null,
        reference: null,
        propertyId: null,
        description: 'Jardinería mensual',
        notes: null,
      })
    })

    // Last month's bill is entered further down; summer bills run higher.
    if (month < prevMonth) {
      t = addMinutes(t, 2)
      await step(db, treasurer, t, async (tx) => {
        await createTransaction(tx, treasurer, {
          kind: 'expense',
          categoryId: await categoryId(tx, 'Servicios'),
          amount: 950 + 40 * monthNumber,
          occurredOn: day(addDays(month, 11)),
          paymentMethod: 'transfer',
          folio: null,
          reference: `CFE ${format(month, 'yyyyMM')}`,
          propertyId: null,
          description: 'Luz de áreas comunes',
          notes: `Recibo CFE ${MONTH_NAMES[(monthNumber + 10) % 12]}`,
        })
      })
    }

    const repairs = [
      { month: 3, category: 'Mantenimiento', amount: 650, description: 'Reparación de la bomba de agua' },
      { month: 4, category: 'Vigilancia', amount: 1800, description: 'Mantenimiento de cámaras' },
      { month: 6, category: 'Mantenimiento', amount: 2400, description: 'Impermeabilización de la caseta' },
    ]
    for (const repair of repairs.filter((candidate) => candidate.month === monthNumber)) {
      t = addMinutes(t, 2)
      await step(db, treasurer, t, async (tx) => {
        await createTransaction(tx, treasurer, {
          kind: 'expense',
          categoryId: await categoryId(tx, repair.category),
          amount: repair.amount,
          occurredOn: day(addDays(month, 17)),
          paymentMethod: 'cash',
          folio: null,
          reference: null,
          propertyId: null,
          description: repair.description,
          notes: null,
        })
      })
    }
  }

  // A1 pays two months in cash on one paper receipt.
  t = addDays(t, 5)
  await step(db, treasurer, t, async (tx) => {
    await recordFeePayment(tx, treasurer, {
      propertyId: await houseId(tx, 'A1'),
      feeMonths: [day(prevMonth), day(thisMonth)],
      occurredOn: day(notBefore(subDays(now, 30), yearStart)),
      folio: '0101',
      paymentMethod: 'cash',
      reference: null,
      notes: null,
    })
  })

  // A2 pays this month by transfer.
  t = addHours(t, 52)
  await step(db, treasurer, t, async (tx) => {
    await recordFeePayment(tx, treasurer, {
      propertyId: await houseId(tx, 'A2'),
      feeMonths: [day(thisMonth)],
      occurredOn: day(notBefore(subDays(now, 28), yearStart)),
      folio: '0102',
      paymentMethod: 'transfer',
      reference: 'SPEI 7781234',
      notes: null,
    })
  })

  // B1 pays last month late: the late fee comes on the same receipt.
  t = addHours(t, 73)
  await step(db, treasurer, t, async (tx) => {
    await recordFeePayment(tx, treasurer, {
      propertyId: await houseId(tx, 'B1'),
      feeMonths: [day(prevMonth)],
      occurredOn: day(notBefore(subDays(now, 25), yearStart)),
      folio: '0103',
      paymentMethod: 'cash',
      reference: null,
      notes: null,
      applyLateFee: true,
    })
  })

  // An expense typed in directly.
  t = addMinutes(t, 24 * 60 + 30)
  await step(db, treasurer, t, async (tx) => {
    await createTransaction(tx, treasurer, {
      kind: 'expense',
      categoryId: await categoryId(tx, 'Servicios'),
      amount: 1240.5,
      occurredOn: day(notBefore(subDays(now, 24), yearStart)),
      paymentMethod: 'transfer',
      folio: null,
      reference: 'CFE 0045612',
      propertyId: null,
      description: 'Luz de áreas comunes',
      notes: 'Recibo CFE Agosto',
    })
  })

  // ---------------------------------------------------------------------------
  // maintenance asks, the treasurer pays
  // ---------------------------------------------------------------------------
  t = addHours(t, 98)
  const paint = await step(db, maintenance, t, (tx) =>
    createRequest(tx, maintenanceRequests, maintenance, {
      title: 'Pintura para el jardín',
      details: 'Dos cubetas de pintura blanca y brochas. Ferretería El Tornillo.',
      amount: 300,
      requestedOn: day(notBefore(subDays(now, 20), yearStart)),
    }),
  )

  t = addHours(t, 53)
  await step(db, treasurer, t, async (tx) => {
    await payRequest(tx, maintenanceRequests, treasurer, paint.id, {
      categoryId: await categoryId(tx, 'Mantenimiento'),
      occurredOn: day(notBefore(subDays(now, 18), yearStart)),
      paymentMethod: 'cash',
      reference: null,
      notes: null,
    })
  })

  t = addDays(t, 8)
  await step(db, maintenance, t, (tx) =>
    createRequest(tx, maintenanceRequests, maintenance, {
      title: 'Cambio de lámparas del pasillo B',
      details: '6 focos LED. Pendiente de comprobante.',
      amount: 450,
      requestedOn: day(notBefore(subDays(now, 10), yearStart)),
    }),
  )

  // ---------------------------------------------------------------------------
  // security asks; the treasurer rejects one and leaves one pending
  // ---------------------------------------------------------------------------
  t = addHours(subDays(t, 5), 3) // a bit before the last maintenance request
  const camera = await step(db, security, t, (tx) =>
    createRequest(tx, securityRequests, security, {
      kind: 'cameras',
      title: 'Reparación de cámara del portón A',
      details: 'La cámara 3 dejó de grabar de noche.',
      amount: 1500,
      requestedOn: day(notBefore(subDays(now, 15), yearStart)),
    }),
  )

  t = addHours(t, 30)
  await step(db, treasurer, t, (tx) =>
    rejectRequest(
      tx,
      securityRequests,
      treasurer,
      camera.id,
      'Falta cotización del proveedor. Vuelve a enviarla con el presupuesto.',
    ),
  )

  t = subHours(now, 5 * 24 + 2)
  await step(db, security, t, (tx) =>
    createRequest(tx, securityRequests, security, {
      kind: 'guards',
      title: 'Turno extra del fin de semana',
      details: 'Guardia adicional por la fiesta de la terraza.',
      amount: 900,
      requestedOn: day(notBefore(subDays(now, 5), yearStart)),
    }),
  )

  // ---------------------------------------------------------------------------
  // the president: the common areas, two bookings, an edit, a delete undone
  // ---------------------------------------------------------------------------
  t = subHours(now, 4 * 24 + 2)
  await step(db, president, t, async (tx) => {
    await tx.insert(amenities).values([
      { name: 'Terraza', defaultFee: 0 },
      { name: 'Alberca', defaultFee: 250 },
    ])
  })

  const bookedOn = day(addDays(now, 10))
  t = subHours(now, 3 * 24 + 4)
  await step(db, president, t, async (tx) => {
    const terrace = await tx.query.amenities.findFirst({ columns: { id: true }, where: { name: 'Terraza' } })
    await createReservation(tx, president, {
      amenityId: terrace?.id ?? '',
      propertyId: await houseId(tx, 'B1'),
      reservedOn: bookedOn,
      amount: 0,
      notes: 'Cumpleaños, 40 personas',
    })
  })

  // Same day, another area: pending for the treasurer to collect.
  t = addHours(t, 2)
  await step(db, president, t, async (tx) => {
    const pool = await tx.query.amenities.findFirst({ columns: { id: true }, where: { name: 'Alberca' } })
    await createReservation(tx, president, {
      amenityId: pool?.id ?? '',
      propertyId: await houseId(tx, 'C2'),
      reservedOn: bookedOn,
      amount: 250,
      notes: null,
    })
  })

  t = subHours(now, 2 * 24 + 1)
  await step(db, president, t, async (tx) => {
    await tx
      .update(residents)
      .set({ phone: '+523139612299', notes: 'Cambió de número' })
      .where(eq(residents.id, residentId(10)))
  })

  t = subHours(now, 27)
  await step(db, president, t, async (tx) => {
    await tx
      .update(properties)
      .set({ deletedAt: sql`now()`, deletedBy: president.id })
      .where(eq(properties.number, 'D5'))
  })
  t = addMinutes(t, 12)
  await step(db, president, t, async (tx) => {
    await tx.update(properties).set({ deletedAt: null, deletedBy: null }).where(eq(properties.number, 'D5'))
  })

  // ---------------------------------------------------------------------------
  // the treasurer fixes a note this morning
  // ---------------------------------------------------------------------------
  t = subHours(now, 3)
  await step(db, treasurer, t, async (tx) => {
    await tx.execute(
      sql`update transactions set notes = 'Recibo CFE, periodo Agosto–Septiembre' where reference = 'CFE 0045612'`,
    )
  })

  await seedPastPeriods(db, year)

  console.log(
    'Created the main admin, 4 board members, 20 houses, 10 residents, 4 periods and 45 days of activity',
  )
}

/** Y-2 and Y-1 with a year of history each, a gap at Y+1 and an empty Y+2. */
async function seedPastPeriods(db: Database, year: number): Promise<void> {
  // An older receipt book: rows sharing a folio must have been created together.
  let folio = 5000

  for (const pastYear of [year - 2, year - 1]) {
    const older = pastYear === year - 2
    await step(db, treasurer, new Date(pastYear, 0, 2, 10), (tx) =>
      createPeriod(tx, {
        name: String(pastYear),
        startsOn: `${pastYear}-01-01`,
        endsOn: `${pastYear}-12-31`,
        monthlyFee: older ? 650 : 700,
        lateFee: older ? 80 : 100,
        dueDay: 10,
      }),
    )

    for (let monthIndex = 0; monthIndex < 12; monthIndex = monthIndex + 1) {
      const month = new Date(pastYear, monthIndex, 1)

      for (const payer of PAYERS) {
        // C1 skips December Y-2 and pays it with January Y-1.
        const isSkippedDecember = payer.number === 'C1' && pastYear === year - 2 && monthIndex === 11
        if (isSkippedDecember) {
          continue
        }
        const feeMonths = [day(month)]
        if (payer.number === 'C1' && pastYear === year - 1 && monthIndex === 0) {
          feeMonths.unshift(`${year - 2}-12-01`)
        }

        folio = folio + 1
        const receipt = String(folio)
        const paidOn = addDays(month, payer.day - 1)
        await step(db, treasurer, addHours(paidOn, 18), async (tx) => {
          await recordFeePayment(tx, treasurer, {
            propertyId: await houseId(tx, payer.number),
            feeMonths,
            occurredOn: day(paidOn),
            folio: receipt,
            paymentMethod: payer.method,
            reference: payer.method === 'transfer' ? `SPEI ${6600000 + folio}` : null,
            notes: null,
          })
        })
      }

      await step(db, treasurer, addHours(addDays(month, 4), 12), async (tx) => {
        await createTransaction(tx, treasurer, {
          kind: 'expense',
          categoryId: await categoryId(tx, 'Jardinería'),
          amount: older ? 1000 : 1100,
          occurredOn: day(addDays(month, 4)),
          paymentMethod: 'cash',
          folio: null,
          reference: null,
          propertyId: null,
          description: 'Jardinería mensual',
          notes: null,
        })
      })

      await step(db, treasurer, addHours(addDays(month, 11), 12), async (tx) => {
        await createTransaction(tx, treasurer, {
          kind: 'expense',
          categoryId: await categoryId(tx, 'Servicios'),
          amount: 850 + 35 * (monthIndex + 1),
          occurredOn: day(addDays(month, 11)),
          paymentMethod: 'transfer',
          folio: null,
          reference: `CFE ${format(month, 'yyyyMM')}`,
          propertyId: null,
          description: 'Luz de áreas comunes',
          notes: null,
        })
      })
    }

    // One bigger repair a year.
    await step(db, treasurer, new Date(pastYear, 4, 20, 12), async (tx) => {
      await createTransaction(tx, treasurer, {
        kind: 'expense',
        categoryId: await categoryId(tx, 'Mantenimiento'),
        amount: older ? 3200 : 2750,
        occurredOn: `${pastYear}-05-20`,
        paymentMethod: 'cash',
        folio: null,
        reference: null,
        propertyId: null,
        description: older ? 'Pintura de la barda perimetral' : 'Cambio de la bomba de agua',
        notes: null,
      })
    })
  }

  // Y+1 stays empty; the board already set up Y+2.
  await step(db, treasurer, subHours(new Date(), 6), (tx) =>
    createPeriod(tx, {
      name: String(year + 2),
      startsOn: `${year + 2}-01-01`,
      endsOn: `${year + 2}-12-31`,
      monthlyFee: 900,
      lateFee: 120,
      dueDay: 10,
    }),
  )
}
