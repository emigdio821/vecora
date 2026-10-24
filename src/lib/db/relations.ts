// How the tables join, for `db.query.<table>.findMany({ with: ... })`. A
// foreign key to users is named for the role the person had in it
// (createdByUser, resolvedByUser...).
import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  users: {
    sessions: r.many.sessions({ from: r.users.id, to: r.sessions.userId }),
    accounts: r.many.accounts({ from: r.users.id, to: r.accounts.userId }),
    /** The resident record of a board member; none for the main admin. */
    resident: r.one.residents({ from: r.users.id, to: r.residents.userId }),
  },
  sessions: {
    user: r.one.users({ from: r.sessions.userId, to: r.users.id, optional: false }),
  },
  accounts: {
    user: r.one.users({ from: r.accounts.userId, to: r.users.id, optional: false }),
  },

  properties: {
    residentLinks: r.many.propertyResidents({ from: r.properties.id, to: r.propertyResidents.propertyId }),
    deletedByUser: r.one.users({ from: r.properties.deletedBy, to: r.users.id }),
  },
  residents: {
    user: r.one.users({ from: r.residents.userId, to: r.users.id }),
    propertyLinks: r.many.propertyResidents({ from: r.residents.id, to: r.propertyResidents.residentId }),
    deletedByUser: r.one.users({ from: r.residents.deletedBy, to: r.users.id }),
  },
  propertyResidents: {
    property: r.one.properties({
      from: r.propertyResidents.propertyId,
      to: r.properties.id,
      optional: false,
    }),
    resident: r.one.residents({ from: r.propertyResidents.residentId, to: r.residents.id, optional: false }),
  },

  periods: {
    transactions: r.many.transactions({ from: r.periods.id, to: r.transactions.periodId }),
  },
  transactionCategories: {
    transactions: r.many.transactions({ from: r.transactionCategories.id, to: r.transactions.categoryId }),
  },
  transactions: {
    category: r.one.transactionCategories({
      from: r.transactions.categoryId,
      to: r.transactionCategories.id,
      optional: false,
    }),
    period: r.one.periods({ from: r.transactions.periodId, to: r.periods.id, optional: false }),
    property: r.one.properties({ from: r.transactions.propertyId, to: r.properties.id }),
    amenityReservation: r.one.amenityReservations({
      from: r.transactions.amenityReservationId,
      to: r.amenityReservations.id,
    }),
    createdByUser: r.one.users({ from: r.transactions.createdBy, to: r.users.id, optional: false }),
    deletedByUser: r.one.users({ from: r.transactions.deletedBy, to: r.users.id }),
  },

  amenities: {
    reservations: r.many.amenityReservations({ from: r.amenities.id, to: r.amenityReservations.amenityId }),
  },
  amenityReservations: {
    amenity: r.one.amenities({ from: r.amenityReservations.amenityId, to: r.amenities.id, optional: false }),
    property: r.one.properties({
      from: r.amenityReservations.propertyId,
      to: r.properties.id,
      optional: false,
    }),
    transactions: r.many.transactions({
      from: r.amenityReservations.id,
      to: r.transactions.amenityReservationId,
    }),
    createdByUser: r.one.users({ from: r.amenityReservations.createdBy, to: r.users.id, optional: false }),
    cancelledByUser: r.one.users({ from: r.amenityReservations.cancelledBy, to: r.users.id }),
  },

  maintenanceRequests: {
    transaction: r.one.transactions({ from: r.maintenanceRequests.transactionId, to: r.transactions.id }),
    createdByUser: r.one.users({ from: r.maintenanceRequests.createdBy, to: r.users.id, optional: false }),
    resolvedByUser: r.one.users({ from: r.maintenanceRequests.resolvedBy, to: r.users.id }),
  },
  securityRequests: {
    transaction: r.one.transactions({ from: r.securityRequests.transactionId, to: r.transactions.id }),
    createdByUser: r.one.users({ from: r.securityRequests.createdBy, to: r.users.id, optional: false }),
    resolvedByUser: r.one.users({ from: r.securityRequests.resolvedBy, to: r.users.id }),
  },

  documentTemplates: {
    createdByUser: r.one.users({ from: r.documentTemplates.createdBy, to: r.users.id }),
  },
  auditLog: {
    actor: r.one.users({ from: r.auditLog.actorId, to: r.users.id }),
  },
}))
