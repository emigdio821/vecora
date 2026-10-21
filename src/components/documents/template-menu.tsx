import { IconSettings, IconTemplate } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { m } from '@/paraglide/messages'
import { type SavedTemplateQueryData, savedTemplatesQueryOptions } from '@/tanstack-queries/documents'
import { ManageTemplatesDialog, type TemplateViewer } from './dialog/manage-templates'
import { DOCUMENT_TEMPLATES, type DocumentTemplate } from './templates'

interface TemplateMenuProps {
  viewer: TemplateViewer
  onSelect: (template: DocumentTemplate) => void
  onSelectSaved: (template: SavedTemplateQueryData) => void
}

/**
 * The templates a document can start from, each with what it's for: Vecora's, then the
 * ones the board saved (while those load, or if there are none, only Vecora's).
 */
export function TemplateMenu({ viewer, onSelect, onSelectSaved }: TemplateMenuProps) {
  const { data: savedTemplates = [] } = useQuery(savedTemplatesQueryOptions)
  const [isManageOpen, setManageOpen] = useState(false)
  const hasSaved = savedTemplates.length > 0

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button variant="outline">
              <IconTemplate className="size-4" />
              {m.documents_templates()}
            </Button>
          }
        />
        <MenuPopup align="end" className="w-72">
          <MenuGroup>
            {/* Alone, the list needs no heading. */}
            {hasSaved && <MenuGroupLabel>{m.documents_templates_built_in()}</MenuGroupLabel>}
            {DOCUMENT_TEMPLATES.map((template) => (
              <TemplateItem
                key={template.id}
                name={template.name()}
                description={template.description()}
                onClick={() => {
                  onSelect(template)
                }}
              />
            ))}
          </MenuGroup>

          {hasSaved && (
            <>
              <MenuSeparator />
              <MenuGroup>
                <MenuGroupLabel>{m.documents_templates_saved()}</MenuGroupLabel>
                {savedTemplates.map((template) => (
                  <TemplateItem
                    key={template.id}
                    name={template.name}
                    description={template.description}
                    onClick={() => {
                      onSelectSaved(template)
                    }}
                  />
                ))}
              </MenuGroup>
              <MenuSeparator />
              <MenuItem
                onClick={() => {
                  setManageOpen(true)
                }}
              >
                <IconSettings />
                {m.documents_templates_manage()}
              </MenuItem>
            </>
          )}
        </MenuPopup>
      </Menu>

      <ManageTemplatesDialog viewer={viewer} open={isManageOpen} onOpenChange={setManageOpen} />
    </>
  )
}

interface TemplateItemProps {
  name: string
  description: string
  onClick: () => void
}

function TemplateItem({ name, description, onClick }: TemplateItemProps) {
  return (
    <MenuItem
      className="flex-col items-start gap-0.5"
      onClick={() => {
        onClick()
      }}
    >
      <span className="wrap-anywhere">{name}</span>
      {description && <span className="text-xs wrap-anywhere text-muted-foreground">{description}</span>}
    </MenuItem>
  )
}
