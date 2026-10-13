import { IconTemplate } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { m } from '@/paraglide/messages'
import { DOCUMENT_TEMPLATES, type DocumentTemplate } from './templates'

interface TemplateMenuProps {
  onSelect: (template: DocumentTemplate) => void
}

/** The templates a document can start from, each with what it's for. */
export function TemplateMenu({ onSelect }: TemplateMenuProps) {
  return (
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
        {DOCUMENT_TEMPLATES.map((template) => (
          <MenuItem
            key={template.id}
            className="flex-col items-start gap-0.5"
            onClick={() => {
              onSelect(template)
            }}
          >
            <span>{template.name()}</span>
            <span className="text-xs text-muted-foreground">{template.description()}</span>
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  )
}
