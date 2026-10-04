"use client";

import React, { useContext } from 'react';
import { Users, Gavel, Zap } from 'lucide-react';
import { DataContext } from '@/components/DataContext';

export default function Dashboard() {
  const { teams, judges } = useContext(DataContext);

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-text-primary text-[3rem] font-heading tracking-[2px] leading-[1.1] uppercase m-0 mb-2">Vice Verse Dashboard</h1>
          <p className="text-text-secondary leading-[1.6] m-0">Welcome to the central command center for Vice Verse 1.0 2026.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold font-tech uppercase tracking-[1px] cursor-pointer transition-all duration-200 border-none text-base bg-accent-primary text-black hover:bg-accent-primary-hover hover:shadow-[0_0_15px_rgba(251,200,21,0.4)] animate-glow">
          <Zap size={18} /> Quick Action
        </button>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mt-4">
        <div className="bg-surface-color rounded-lg border border-border-color p-6 transition-all duration-300 hover:border-accent-secondary hover:shadow-[0_0_20px_rgba(255,0,127,0.15)] hover:-translate-y-1 flex items-center gap-5 animate-fade-in animate-delay-1">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center animate-glow" style={{background: 'rgba(251, 200, 21, 0.1)', color: 'var(--accent-primary)'}}>
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-[1.8rem] m-0 text-text-primary font-heading tracking-[2px] leading-[1.1] uppercase">{teams.length * 3}</h3>
            <p className="m-0 text-[0.9rem] text-text-secondary leading-[1.6]">Total Participants</p>
          </div>
        </div>

        <div className="bg-surface-color rounded-lg border border-border-color p-6 transition-all duration-300 hover:border-accent-secondary hover:shadow-[0_0_20px_rgba(255,0,127,0.15)] hover:-translate-y-1 flex items-center gap-5 animate-fade-in animate-delay-2">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center animate-glow" style={{background: 'rgba(255, 0, 127, 0.1)', color: 'var(--accent-secondary)'}}>
            <Gavel size={24} />
          </div>
          <div>
            <h3 className="text-[1.8rem] m-0 text-text-primary font-heading tracking-[2px] leading-[1.1] uppercase">{judges.length}</h3>
            <p className="m-0 text-[0.9rem] text-text-secondary leading-[1.6]">Active Judges</p>
          </div>
        </div>
      </div>

      <div className="mt-8 animate-fade-in animate-delay-3">
        <h2 className="text-[1.25rem] mb-4 text-text-primary font-heading tracking-[2px] leading-[1.1] uppercase">Active Judges Panel</h2>
        <div className="glass-panel p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left border-b border-border-color text-accent-primary font-tech text-[0.9rem] uppercase tracking-[1px]">Judge</th>
                <th className="p-4 text-left border-b border-border-color text-accent-primary font-tech text-[0.9rem] uppercase tracking-[1px]">Specialization</th>
                <th className="p-4 text-left border-b border-border-color text-accent-primary font-tech text-[0.9rem] uppercase tracking-[1px]">Assigned Teams</th>
                <th className="p-4 text-left border-b border-border-color text-accent-primary font-tech text-[0.9rem] uppercase tracking-[1px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {judges.map(judge => {
                const assignedCount = teams.filter(t => t.judgeId === judge.id).length;
                return (
                  <tr key={judge.id} className="transition-colors duration-200 hover:bg-[rgba(255,0,127,0.05)] border-b border-border-color last:border-b-0">
                    <td className="p-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-bg-color to-bg-color flex items-center justify-center font-bold text-white" style={{ background: `linear-gradient(135deg, ${judge.theme}, var(--bg-color))` }}>
                          {judge.initials}
                        </div>
                        <div>
                          <div className="font-medium">{judge.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-left">{judge.specialization}</td>
                    <td className="p-4 text-left">{assignedCount}</td>
                    <td className="p-4 text-left">
                      <span className="px-2.5 py-1 text-xs font-bold font-tech tracking-[1px] uppercase bg-[rgba(16,185,129,0.1)] text-status-success border border-status-success">Online</span>
                    </td>
                  </tr>
                );
              })}
              {judges.length === 0 && (
                <tr className="border-b border-border-color last:border-b-0">
                  <td colSpan={4} className="p-4 text-center text-text-secondary">No judges currently active.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
