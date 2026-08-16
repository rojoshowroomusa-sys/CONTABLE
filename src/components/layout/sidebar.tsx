'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { menuItems, empresaMenuItems } from '@/lib/constants/menus'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'relative flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          {!collapsed && (
            <span className="text-lg font-semibold">Sistema Contable</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                collapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-2 py-2">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>

          <div className="mt-4">
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-medium uppercase text-muted-foreground">
                Empresa
              </p>
            )}
            <nav className="space-y-1">
              {empresaMenuItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                />
              ))}
            </nav>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: {
    label: string
    icon?: React.ComponentType<{ className?: string }>
    href: string
    children?: { label: string; href: string }[]
  }
  pathname: string
  collapsed: boolean
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  if (collapsed && Icon) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent',
              isActive && 'bg-sidebar-accent text-sidebar-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  if (item.children) {
    return (
      <div>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent',
            isActive && 'bg-sidebar-accent text-sidebar-foreground'
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {item.label}
        </Link>
        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                'block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-accent',
                pathname === child.href &&
                  'bg-sidebar-accent text-sidebar-foreground font-medium'
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent',
        isActive && 'bg-sidebar-accent text-sidebar-foreground'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {item.label}
    </Link>
  )
}
