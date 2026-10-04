"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Gavel, Calendar, Settings } from 'lucide-react';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/judges', icon: Gavel, label: 'Judges Portal' },
    { href: '/participants', icon: Users, label: 'Participants Portal' },
    { href: '/event-flow', icon: Calendar, label: 'Event Flow' },
    { href: '/event-details', icon: Settings, label: 'Event Details' }
  ];

  return (
    <aside className="w-full md:w-[280px] bg-surface-color md:border-r border-b md:border-b-0 border-border-color flex flex-col justify-between py-6 md:sticky top-0 md:h-screen z-10">
      <div className="px-6 pb-6 border-b border-border-color">
        <div className="flex items-center gap-4">
          <img src="/Vice_verse_logo.png" alt="Vice Verse Logo" style={{ width: '80px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(251, 200, 21, 0.3))' }} />
          <div>
            <h2 className="font-heading text-[1.8rem] tracking-[2px] m-0 text-text-primary uppercase animate-flicker">Vice Verse Admin</h2>
            <p className="font-tech text-xs text-accent-secondary m-0 font-bold tracking-[1px] uppercase">Version 1.0</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
        <p className="font-tech text-xs uppercase tracking-[2px] text-text-secondary mb-3 pl-3 font-bold">Main Menu</p>

        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 py-3 px-4 rounded-none font-tech font-semibold uppercase tracking-[1px] transition-all duration-200 border-l-[3px] animate-fade-in opacity-0
                ${isActive
                  ? 'bg-gradient-to-r from-[rgba(255,0,127,0.15)] to-transparent text-text-primary border-accent-secondary nav-item-active'
                  : 'text-text-secondary border-transparent hover:bg-[rgba(255,0,127,0.05)] hover:text-text-primary hover:border-border-color hover:pl-6'
                }
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <item.icon
                size={20}
                className={`transition-all duration-300 ${isActive ? 'text-accent-secondary' : 'group-hover:text-text-primary'}`}
                style={{ filter: isActive ? 'drop-shadow(0 0 10px #FF007F) drop-shadow(0 0 20px #FF007F)' : 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}
              />
              <span className={`transition-all duration-300 ${isActive ? 'animate-flicker' : ''}`} style={{ textShadow: isActive ? '0 0 10px #FF007F, 0 0 20px rgba(255,0,127,0.5)' : '0 0 5px rgba(255,255,255,0.3)' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="px-3 py-6 border-t border-border-color mt-auto">
        <div className="flex flex-col justify-center items-center gap-6">
          <img src="/vvce-logo.png" alt="VVCE Logo" className="w-auto h-[90px] object-contain transition-transform hover:scale-105" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 200, 0, 0.8))' }} />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
            <div className="flex justify-end">
              <img src="/ivc-logo-transparent.png" alt="IVC logo" className="max-w-full h-auto max-h-[75px] object-contain transition-transform hover:scale-105" style={{ filter: 'drop-shadow(0 0 12px rgba(255, 0, 127, 0.5))' }} />
            </div>
            <span className="font-tech text-[1.2rem] text-text-secondary font-bold text-center">X</span>
            <div className="flex justify-start">
              <img src="/image.png" alt="InUnity Logo" className="max-w-full h-auto max-h-[75px] object-contain transition-transform hover:scale-105" style={{ filter: 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.5))' }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
