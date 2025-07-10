'use client';

import {
  Home,
  LogOut,
  Users,
  Users2,
  MessageSquare,
  Phone,
  MessageCircle,
  Scan,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import he from '@/locales/he';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: he.dashboard.title, href: '/dashboard', icon: Home },
    { name: he.groups.title, href: '/dashboard/groups', icon: Users },
    {
      name: he.participants.title,
      href: '/dashboard/participants',
      icon: Users2,
    },
    {
      name: he.conversations.title,
      href: '/dashboard/conversations',
      icon: MessageCircle,
    },
    {
      name: he.systemMessages.title,
      href: '/dashboard/system-messages',
      icon: MessageSquare,
    },
    {
      name: he.whatsappStatus.title,
      href: '/dashboard/whatsapp-status',
      icon: Phone,
    },
    {
      name: he.faceRecognitionDebug.title,
      href: '/dashboard/face-recognition-debug',
      icon: Scan,
    },
  ];

  return (
    <Sidebar side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{he.common.fullAppName}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      data-state={isActive ? 'active' : 'inactive'}
                      className={isActive ? 'bg-accent' : ''}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5 ml-3" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <form
                    action={async () => {
                      await signOut();
                    }}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <LogOut className="h-5 w-5 ml-3" />
                      {he.common.logout}
                    </Button>
                  </form>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
