import { Activity, CircleHelp, ClipboardList, Leaf, Menu, Plus, Sprout, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';

type AppShellProps = { children: ReactNode };

const navItems = [
  { href: '/', label: 'Overview', icon: Activity },
  { href: '/advisor/crop', label: 'Plan a crop', icon: Sprout },
  { href: '/advisor/pest', label: 'Diagnose a pest', icon: CircleHelp },
  { href: '/history', label: 'My reports', icon: ClipboardList },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-sm">
        <Leaf size={21} strokeWidth={2.2} />
      </div>
      <div>
        <div className="font-serif text-[17px] font-bold tracking-[-.03em]">AgroAdvisor</div>
        <div className="font-mono text-[9px] uppercase tracking-[.22em] opacity-60">field intelligence</div>
      </div>
    </div>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="space-y-1.5" aria-label="Primary navigation">
      <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.45)]">Workspace</p>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? location === '/' : location.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
            className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] shadow-inner' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent)/.6)] hover:text-[hsl(var(--sidebar-foreground))]'}`}
          >
            <Icon size={18} strokeWidth={active ? 2.3 : 1.8} className={active ? 'text-[hsl(var(--sidebar-primary))]' : 'opacity-75'} />
            <span>{label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck();
  const healthy = health.data?.status === 'ok' || health.data?.status === 'healthy';

  return (
    <div className="grain app-shell-bg flex min-h-[100dvh] text-[hsl(var(--foreground))]">
      <aside className="hidden w-[250px] shrink-0 flex-col bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] md:flex">
        <div className="px-3"><BrandMark /></div>
        <div className="mt-12 flex-1"><Navigation /></div>
        <div className="border-t border-[hsl(var(--sidebar-border))] px-3 pt-5">
          <div className="flex items-center gap-2.5 rounded-xl bg-[hsl(var(--sidebar-accent)/.55)] px-3 py-3">
            <span className={`h-2 w-2 rounded-full ${healthy ? 'bg-[#c7dd72]' : 'bg-[hsl(var(--sidebar-foreground)/.4)]'}`} />
            <span className="text-xs text-[hsl(var(--sidebar-foreground)/.72)]">{healthy ? 'Advisor online' : 'Connecting to advisor'}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 px-1 text-[11px] text-[hsl(var(--sidebar-foreground)/.4)]"><span>v1.0</span><span>•</span><span>Built for the field</span></div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[hsl(158_33%_17%/.36)] backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="flex h-full w-[min(84vw,300px)] flex-col bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-3"><BrandMark /><button onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-close-menu" className="rounded-lg p-2 hover:bg-[hsl(var(--sidebar-accent))]"><X size={18} /></button></div>
            <div className="mt-12 flex-1"><Navigation onNavigate={() => setMobileOpen(false)} /></div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[hsl(var(--border)/.75)] bg-[hsl(var(--background)/.86)] px-5 backdrop-blur-md md:px-10">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="button-open-menu" className="rounded-lg p-2 text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))] md:hidden"><Menu size={21} /></button>
          <div className="hidden items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] md:flex"><span className="font-mono text-[10px] uppercase tracking-[.18em]">Field desk</span><span className="text-[hsl(var(--border))]">/</span><span>Practical guidance, one decision at a time.</span></div>
          <Link href="/advisor/crop" data-testid="link-header-new-plan" className="ml-auto flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3.5 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"><Plus size={16} /> <span className="hidden sm:inline">New consultation</span><span className="sm:hidden">New</span></Link>
        </header>
        <main className="w-full flex-1 px-5 py-7 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="animate-rise">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--primary))]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />{eyebrow}</div>
        <h1 className="max-w-2xl font-serif text-3xl font-bold leading-[1.05] tracking-[-.045em] text-[hsl(var(--foreground))] md:text-[46px]">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-[15px] leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-3" aria-label="Loading" data-testid="status-loading">{Array.from({ length: lines }).map((_, i) => <div key={i} className={`skeleton h-14 rounded-xl ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}</div>;
}

export function ErrorBlock({ message = 'We could not reach the field desk.', onRetry }: { message?: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-[hsl(var(--destructive)/.28)] bg-[hsl(var(--destructive)/.06)] p-5" data-testid="status-error"><p className="font-semibold text-[hsl(var(--destructive))]">Something needs a second look.</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{message}</p>{onRetry && <button onClick={onRetry} data-testid="button-retry" className="mt-4 rounded-lg bg-[hsl(var(--destructive))] px-3 py-2 text-xs font-semibold text-[hsl(var(--destructive-foreground))]">Try again</button>}</div>;
}