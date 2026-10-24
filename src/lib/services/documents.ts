// Saved document templates: any board member saves one under their own
// name (document.write); only its author, or whoever manages every template
// (document.manage, the admin), renames or deletes it. The document itself is
// fixed once saved: only the name and the description change.
import { eq } from 'drizzle-orm'
import { can } from '@/lib/auth/permissions'
import type { Transaction } from '@/lib/db/client'
import { documentTemplates } from '@/lib/db/schema'
import type { Actor } from './actor'
import { ServiceError } from './errors'

async function requireAuthor(tx: Transaction, actor: Actor, id: string): Promise<void> {
  const template = await tx.query.documentTemplates.findFirst({
    columns: { createdBy: true },
    where: { id },
  })
  if (!template) {
    throw new ServiceError('not_found', `template ${id}`)
  }
  if (template.createdBy !== actor.id && !can(actor.roles, { document: ['manage'] })) {
    throw new ServiceError('not_author')
  }
}

export async function renameTemplate(
  tx: Transaction,
  actor: Actor,
  id: string,
  input: { name: string; description: string },
): Promise<void> {
  await requireAuthor(tx, actor, id)
  await tx.update(documentTemplates).set(input).where(eq(documentTemplates.id, id))
}

export async function deleteTemplate(tx: Transaction, actor: Actor, id: string): Promise<void> {
  await requireAuthor(tx, actor, id)
  await tx.delete(documentTemplates).where(eq(documentTemplates.id, id))
}
