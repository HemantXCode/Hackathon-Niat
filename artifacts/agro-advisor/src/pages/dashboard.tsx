import { ArrowRight, BarChart3, CalendarDays, ClipboardCheck, Leaf, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { useGetDashboardSummary } from '@workspace/api-client-react';
import { AppShell, ErrorBlock, LoadingBlock, PageHeading } from '@/components/layout';
import { ConsultationCard, SummaryRow } from '@/components/advisory-ui';

export default function Dashboard() {
  const query = useGetDashboardSummary();
  const summary = query.data;
  return <AppShell><div className="mx-auto max-w-[1220px]">
    <PageHeading eyebrow="Your field desk" title="Make the next good decision." description="A calm place for crop plans, pest checks, and the advice you want to keep close.">
      <div className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] md:flex"><CalendarDays size={14} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
    </PageHeading>
    {query.isLoading ? <LoadingBlock lines={4} /> : query.isError ? <ErrorBlock onRetry={() => query.refetch()} /> : <div className="animate-rise animate-in-2">
      <div className="grid gap-4 md:grid-cols-[1.35fr_.65fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <ConsultationCard kind="crop" href="/advisor/crop" prompt="01 / planning" title="Plan your next crop" description="Match your soil, water, and growing conditions with crops that make sense." />
          <ConsultationCard kind="pest" href="/advisor/pest" prompt="02 / protection" title="Spot a pest or disease" description="Describe what you see and get a focused first response for the field." />
        </div>
        <div className="relative overflow-hidden rounded-[24px] bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] shadow-sm"><div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full border-[24px] border-[hsl(var(--accent)/.2)]" /><div className="relative flex h-full flex-col justify-between"><div><div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><BarChart3 size={19} /></div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary-foreground)/.6)]">This season, in your desk</p><div className="mt-3 font-serif text-5xl font-bold tracking-[-.06em]">{summary?.totalConsultations ?? 0}</div><p className="mt-1 text-sm text-[hsl(var(--primary-foreground)/.65)]">consultations saved</p></div><div className="mt-8 grid grid-cols-2 gap-3 border-t border-[hsl(var(--primary-foreground)/.15)] pt-4 text-xs"><div><p className="font-mono text-lg text-[hsl(var(--accent))]">{summary?.cropPlans ?? 0}</p><p className="text-[hsl(var(--primary-foreground)/.6)]">crop plans</p></div><div><p className="font-mono text-lg text-[hsl(var(--accent))]">{summary?.pestDiagnoses ?? 0}</p><p className="text-[hsl(var(--primary-foreground)/.6)]">diagnoses</p></div></div></div></div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_310px]">
        <section className="rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.75)] p-5 shadow-xs md:p-7"><div className="mb-6 flex items-end justify-between"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">The paper trail</p><h2 className="font-serif text-2xl font-bold tracking-[-.04em]">Recent activity</h2></div><Link href="/history" data-testid="link-view-history" className="flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] hover:underline">View all <ArrowRight size={14} /></Link></div>{summary?.recent?.length ? <div>{summary.recent.slice(0, 5).map((item, index) => <SummaryRow key={item.id} item={item} index={index} />)}</div> : <div className="rounded-xl bg-[hsl(var(--secondary)/.55)] px-5 py-10 text-center"><ClipboardCheck className="mx-auto mb-3 text-[hsl(var(--primary)/.6)]" size={28} /><p className="font-semibold">Your decisions will show up here.</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Start with a crop plan or a pest diagnosis.</p></div>}</section>
        <aside className="space-y-4"><div className="rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.7)] p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={17} className="text-[hsl(var(--primary))]" /><h3 className="font-serif text-lg font-bold">A grounded second opinion</h3></div><p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">AgroAdvisor helps you think through a decision. Pair every recommendation with what you know from the field.</p><div className="mt-5 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-4 text-xs font-semibold text-[hsl(var(--primary))]"><Leaf size={14} /> Observe. Ask. Act.</div></div><div className="rounded-[22px] bg-[hsl(var(--accent)/.46)] p-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--foreground)/.6)]">Quick access</p><Link href="/history" data-testid="link-quick-history" className="mt-3 flex items-center justify-between font-serif text-xl font-bold tracking-[-.03em] hover:underline">Browse saved reports <ArrowRight size={18} /></Link></div></aside>
      </div>
    </div>}
  </div></AppShell>;
}