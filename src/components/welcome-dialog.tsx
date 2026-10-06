import {
  IconBuildingCommunity,
  IconEye,
  IconFileText,
  IconGavel,
  IconHeartHandshake,
  IconHistory,
  IconHome,
  IconPigMoney,
  IconReceipt,
  IconSettings,
  IconTool,
  IconUrgent,
  IconUser,
  type TablerIcon,
} from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import { useCurrentUser } from '@/components/current-user-provider'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AppRole } from '@/lib/supabase/current-user'
import { m } from '@/paraglide/messages'
import { markWelcomed } from '@/server-actions/profile'
import { USER_QUERY_KEY } from '@/tanstack-queries/session'

/** `?welcome=true` reopens the dialog; the user menu sets it. */
export function useWelcomeParam() {
  return useQueryState('welcome', parseAsBoolean.withDefault(false))
}

interface Ability {
  icon: TablerIcon
  title: string
  description: string
  roles: AppRole[]
}

/** What each role can change. Admin gets every entry, like `private.has_role`. */
const ABILITIES: Ability[] = [
  {
    icon: IconBuildingCommunity,
    get title() {
      return m.common_section_residential()
    },
    get description() {
      return m.settings_welcome_ability_residential()
    },
    roles: ['president'],
  },
  {
    icon: IconGavel,
    get title() {
      return m.common_section_presidency()
    },
    get description() {
      return m.settings_welcome_ability_presidency()
    },
    roles: ['president', 'treasurer'],
  },
  {
    icon: IconHeartHandshake,
    get title() {
      return m.common_section_hoa_board()
    },
    get description() {
      return m.settings_welcome_ability_hoa_board()
    },
    roles: ['president'],
  },
  {
    icon: IconPigMoney,
    get title() {
      return m.common_section_treasury()
    },
    get description() {
      return m.settings_welcome_ability_treasury()
    },
    roles: ['treasurer'],
  },
  {
    icon: IconReceipt,
    get title() {
      return m.settings_welcome_payment_requests()
    },
    get description() {
      return m.settings_welcome_ability_payment_requests()
    },
    roles: ['treasurer'],
  },
  {
    icon: IconTool,
    get title() {
      return m.common_section_maintenance()
    },
    get description() {
      return m.settings_welcome_ability_maintenance()
    },
    roles: ['maintenance'],
  },
  {
    icon: IconUrgent,
    get title() {
      return m.common_section_security()
    },
    get description() {
      return m.settings_welcome_ability_security()
    },
    roles: ['security'],
  },
  {
    icon: IconHistory,
    get title() {
      return m.common_section_logs()
    },
    get description() {
      return m.settings_welcome_ability_logs()
    },
    roles: ['admin'],
  },
]

/**
 * A few pages about the app and what the user's roles let them do. Opens by
 * itself until it's closed once, then only from the user menu.
 */
export function WelcomeDialog() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  const [isRequested, setRequested] = useWelcomeParam()
  const [isFirstVisit, setFirstVisit] = useState(!user.welcomed)

  // Nothing to tell the user if it fails: the dialog just shows up once more.
  const mutation = useMutation({
    mutationFn: markWelcomed,
    onSuccess: () => {
      // The cached user still says not welcomed; refetch it on the next navigation.
      void queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] })
    },
  })

  function markSeen() {
    if (isFirstVisit) {
      setFirstVisit(false)
      mutation.mutate()
    }
  }

  function close() {
    markSeen()
    void setRequested(null)
  }

  return (
    <Dialog
      open={isFirstVisit || isRequested}
      onOpenChange={(open) => {
        if (!open) close()
      }}
      // A stray click outside shouldn't skip it; the X and Escape still close it.
      disablePointerDismissal
    >
      <DialogPopup>
        {/* Mounted only while open, so it always starts from the first page. */}
        <WelcomeSteps onDone={close} onLeave={markSeen} />
      </DialogPopup>
    </Dialog>
  )
}

interface Step {
  title: string
  description: string
  content: React.ReactNode
}

/** `onLeave`: a link inside was followed; the new URL already drops `?welcome`. */
function WelcomeSteps({ onDone, onLeave }: { onDone: () => void; onLeave: () => void }) {
  const user = useCurrentUser()
  const [index, setIndex] = useState(0)

  const isAdmin = user.roles.includes('admin')
  const isManager = isAdmin || user.roles.includes('president')
  const abilities = ABILITIES.filter(
    (ability) => isAdmin || ability.roles.some((role) => user.roles.includes(role)),
  )

  const steps: Step[] = [
    {
      title: m.settings_welcome_intro_title(),
      description: m.settings_welcome_intro_description(),
      content: (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{m.settings_welcome_signed_in_as()}</span>
          {user.roles.map((role) => (
            <RoleNameBadge key={role} roleName={role} />
          ))}
        </div>
      ),
    },
    {
      title: m.settings_welcome_abilities_title(),
      description: m.settings_welcome_abilities_description(),
      content: (
        <InfoList>
          {abilities.map((ability) => (
            <InfoRow key={ability.title} icon={ability.icon} title={ability.title}>
              {ability.description}
            </InfoRow>
          ))}
        </InfoList>
      ),
    },
    {
      title: m.settings_welcome_overview_title(),
      description: m.settings_welcome_overview_description(),
      content: (
        <InfoList>
          <InfoRow icon={IconEye} title={m.settings_welcome_view_all_title()}>
            {m.settings_welcome_view_all_body()}
          </InfoRow>
          <InfoRow icon={IconHome} title={m.common_section_home()}>
            {m.settings_welcome_home_body()}
          </InfoRow>
          <InfoRow icon={IconFileText} title={m.common_section_financial_report()}>
            {m.settings_welcome_report_body()}
          </InfoRow>
          <InfoRow icon={IconHistory} title={m.settings_welcome_logged_title()}>
            {m.settings_welcome_logged_body()}
          </InfoRow>
          <InfoRow icon={IconUser} title={m.settings_welcome_revisit_title()}>
            {m.settings_welcome_revisit_body()}
          </InfoRow>
        </InfoList>
      ),
    },
  ]

  if (isManager) {
    steps.push({
      title: m.settings_welcome_first_step_title(),
      description: m.settings_welcome_first_step_description(),
      content: (
        <div className="flex flex-col gap-4">
          <InfoList>
            <InfoRow icon={IconHeartHandshake} title={m.settings_welcome_invite_title()}>
              {m.settings_welcome_invite_body()}
            </InfoRow>
            <InfoRow icon={IconSettings} title={m.common_section_settings()}>
              {m.settings_welcome_settings_body()}
            </InfoRow>
          </InfoList>
          <Button
            className="self-start"
            variant="outline"
            render={<Link to="/hoa-board" />}
            onClick={onLeave}
          >
            <IconHeartHandshake />
            {m.settings_welcome_go_to_board()}
          </Button>
        </div>
      ),
    })
  }

  const step = steps[index]
  const isLast = index === steps.length - 1

  return (
    <>
      <DialogHeader>
        <DialogTitle>{step.title}</DialogTitle>
        <DialogDescription>{step.description}</DialogDescription>
      </DialogHeader>

      <DialogPanel>{step.content}</DialogPanel>

      <DialogFooter>
        <span className="self-center text-sm text-muted-foreground sm:me-auto">
          {m.settings_welcome_step_count({ current: index + 1, total: steps.length })}
        </span>
        {index > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setIndex(index - 1)
            }}
          >
            {m.common_action_back()}
          </Button>
        )}
        {isLast ? (
          <Button onClick={onDone}>{m.settings_welcome_start()}</Button>
        ) : (
          <Button
            onClick={() => {
              setIndex(index + 1)
            }}
          >
            {m.common_action_next()}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

function InfoList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-4">{children}</ul>
}

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: TablerIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{children}</span>
      </div>
    </li>
  )
}
