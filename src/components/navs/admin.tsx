// 'use client'

// import { LogsIcon, UsersIcon } from 'lucide-react'
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { useIsAdmin } from '@/hooks/use-rbac'
// import {
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   useSidebar,
// } from '../ui/sidebar'

// export function NavAdmin({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
//   const pathname = usePathname()
//   const { setOpenMobile } = useSidebar()
//   const isAdmin = useIsAdmin()

//   if (!isAdmin) {
//     return null
//   }

//   return (
//     <SidebarGroup {...props}>
//       <SidebarGroupLabel>Administrador</SidebarGroupLabel>
//       <SidebarGroupContent>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton
//               onClick={() => setOpenMobile(false)}
//               isActive={pathname === '/admin/profiles'}
//               render={
//                 <Link href="/admin/profiles">
//                   <UsersIcon className="size-4" />
//                   <span>Perfiles</span>
//                 </Link>
//               }
//             />
//           </SidebarMenuItem>

//           <SidebarMenuItem>
//             <SidebarMenuButton
//               onClick={() => setOpenMobile(false)}
//               isActive={pathname === '/admin/audit'}
//               render={
//                 <Link href="/admin/audit">
//                   <LogsIcon className="size-4" />
//                   <span>Auditoría</span>
//                 </Link>
//               }
//             />
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarGroupContent>
//     </SidebarGroup>
//   )
// }

export function NavAdmin() {
  return null
}
