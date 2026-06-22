import React, { useState } from 'react';
import { 
  Page, PageHeader, PageContent, PageSection, PageMetrics, PageActions 
} from '../components/layout/PageLayout';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { AppBadge } from '../components/ui/AppBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import { EmptyState } from '../components/ui/EmptyState';
import { AppModal } from '../components/ui/AppModal';
import { Search, Mail, AlertCircle, TrendingUp, Users, Target, Database } from 'lucide-react';

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Page>
      <PageHeader 
        title="Design System" 
        description="The source of truth for ArchRevenue's premium UI components. All pages should be assembled using these foundational blocks."
        breadcrumbs={<AppBadge variant="primary">Internal Tooling</AppBadge>}
      >
        <PageActions>
          <AppButton variant="secondary">Documentation</AppButton>
          <AppButton variant="primary">Download Assets</AppButton>
        </PageActions>
      </PageHeader>

      <PageContent>

        <PageSection title="Color & Surface Hierarchy" description="Distinct layers without relying on heavy shadows.">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-surface-background border border-border-default rounded-card">
              <p className="text-[13px] font-semibold text-text-primary">Level 0: Background</p>
              <p className="text-[12px] text-text-tertiary font-mono mt-1">bg-surface-background</p>
            </div>
            <div className="p-6 bg-surface-sidebar border border-border-default rounded-card">
              <p className="text-[13px] font-semibold text-text-primary">Level 1: Sidebar</p>
              <p className="text-[12px] text-text-tertiary font-mono mt-1">bg-surface-sidebar</p>
            </div>
            <div className="p-6 bg-surface-secondary border border-border-default rounded-card">
              <p className="text-[13px] font-semibold text-text-primary">Level 2: Secondary</p>
              <p className="text-[12px] text-text-tertiary font-mono mt-1">bg-surface-secondary</p>
            </div>
            <div className="p-6 bg-surface-card shadow-sm border border-border-default rounded-card">
              <p className="text-[13px] font-semibold text-text-primary">Level 3: Card</p>
              <p className="text-[12px] text-text-tertiary font-mono mt-1">bg-surface-card</p>
            </div>
          </div>
        </PageSection>

        <PageSection title="Typography" description="One strict hierarchy using Inter and JetBrains Mono.">
          <AppCard className="flex flex-col gap-6">
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight text-text-primary">Page Title</h1>
              <p className="text-[12px] text-text-tertiary font-mono">24px, SemiBold, Tracking-tight</p>
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">Section Title</h2>
              <p className="text-[12px] text-text-tertiary font-mono">16px, SemiBold</p>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">Card Title</h3>
              <p className="text-[12px] text-text-tertiary font-mono">14px, SemiBold</p>
            </div>
            <div>
              <p className="text-[13px] text-text-secondary">Body (Standard text used for paragraphs and descriptions)</p>
              <p className="text-[12px] text-text-tertiary font-mono mt-1">13px, Regular</p>
            </div>
            <div>
              <p className="text-[12px] text-text-tertiary">Caption (Helper text or less important info)</p>
              <p className="text-[12px] text-text-tertiary font-mono mt-1">12px, Regular</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Label</p>
              <p className="text-[12px] text-text-tertiary font-mono mt-1">11px, SemiBold, Uppercase</p>
            </div>
          </AppCard>
        </PageSection>

        <PageSection title="Buttons" description="Standardized interactive elements with motion timings.">
          <AppCard className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-3">
              <AppButton variant="primary">Primary Action</AppButton>
              <AppButton variant="primary" isLoading>Loading State</AppButton>
            </div>
            <div className="flex flex-col gap-3">
              <AppButton variant="secondary">Secondary Action</AppButton>
              <AppButton variant="secondary" leftIcon={<Mail className="w-4 h-4" />}>With Icon</AppButton>
            </div>
            <div className="flex flex-col gap-3">
              <AppButton variant="ghost">Ghost Action</AppButton>
              <AppButton variant="ghost" disabled>Disabled</AppButton>
            </div>
            <div className="flex flex-col gap-3">
              <AppButton variant="danger">Danger Action</AppButton>
              <AppButton variant="danger" leftIcon={<AlertCircle className="w-4 h-4" />}>Delete Lead</AppButton>
            </div>
          </AppCard>
        </PageSection>

        <PageSection title="Inputs & Forms" description="Predictable states and identical structure for all fields.">
          <AppCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AppInput label="Standard Input" placeholder="John Doe" />
              <AppInput label="With Left Icon" placeholder="Search..." leftIcon={<Search className="w-4 h-4" />} />
              <AppInput label="With Error" placeholder="name@company.com" defaultValue="invalid-email" error="Please enter a valid email address." />
              <AppInput label="With Helper" placeholder="Acme Corp" helperText="We will automatically fetch company data." />
              <AppInput label="Disabled State" placeholder="Cannot edit" disabled />
            </div>
          </AppCard>
        </PageSection>

        <PageSection title="Badges & Statuses" description="Consistent semantic labeling.">
          <AppCard className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <AppBadge variant="neutral">Neutral</AppBadge>
              <AppBadge variant="primary">Primary</AppBadge>
              <AppBadge variant="success">Success</AppBadge>
              <AppBadge variant="warning">Warning</AppBadge>
              <AppBadge variant="danger">Danger</AppBadge>
            </div>
            <div className="w-px h-8 bg-border-default mx-4" />
            <div className="flex items-center gap-2">
              <StatusBadge status="new" />
              <StatusBadge status="contacted" />
              <StatusBadge status="qualified" />
              <StatusBadge status="proposal" />
              <StatusBadge status="won" />
              <StatusBadge status="lost" />
            </div>
          </AppCard>
        </PageSection>

        <PageSection title="Cards & Elevation" description="Subtle hover states and layered shadows.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AppCard level={1} hoverable>
              <h3 className="text-[14px] font-semibold text-text-primary mb-2">Level 1 (Resting)</h3>
              <p className="text-[13px] text-text-secondary">Standard card with soft Level 1 shadow and interactive hover elevation to Level 2.</p>
            </AppCard>
            <AppCard level={2}>
              <h3 className="text-[14px] font-semibold text-text-primary mb-2">Level 2 (Elevated)</h3>
              <p className="text-[13px] text-text-secondary">Used for slightly elevated or grouped inner content inside larger panels.</p>
            </AppCard>
            <AppCard level={3}>
              <h3 className="text-[14px] font-semibold text-text-primary mb-2">Level 3 (Floating)</h3>
              <p className="text-[13px] text-text-secondary">Simulates a floating menu or dropdown with a more pronounced shadow.</p>
            </AppCard>
          </div>
        </PageSection>

        <PageSection title="Metrics" description="Dashboard and Pipeline statistical cards.">
          <PageMetrics className="px-0 pt-0">
            <MetricCard 
              title="Pipeline Value" 
              value="$124,500" 
              icon={<TrendingUp className="w-4 h-4" />}
              trend={{ value: 12.5, label: "vs last month" }} 
            />
            <MetricCard 
              title="Active Deals" 
              value="42" 
              icon={<Target className="w-4 h-4" />}
              trend={{ value: 5.2, label: "vs last month" }} 
            />
            <MetricCard 
              title="Win Rate" 
              value="28.4%" 
              icon={<Users className="w-4 h-4" />}
              trend={{ value: -2.1, label: "vs last month" }} 
            />
          </PageMetrics>
        </PageSection>

        <PageSection title="Empty States" description="Clear actions when no data is present.">
          <EmptyState 
            icon={<Database className="w-6 h-6" />}
            title="No leads found"
            description="You haven't imported any leads yet. Upload a CSV to get started."
            action={<AppButton variant="primary">Import CSV</AppButton>}
          />
        </PageSection>

        <PageSection title="Modals" description="Standardized popup framing.">
          <AppCard className="flex flex-col items-center justify-center py-12">
            <AppButton variant="primary" onClick={() => setModalOpen(true)}>
              Open Standard Modal
            </AppButton>

            <AppModal 
              isOpen={modalOpen} 
              onClose={() => setModalOpen(false)}
              title="Import New Leads"
              footer={
                <>
                  <AppButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AppButton>
                  <AppButton variant="primary">Confirm Import</AppButton>
                </>
              }
            >
              <div className="flex flex-col gap-4">
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Upload a CSV file containing your raw lead data. The system will automatically parse names, companies, and emails, and instantly begin researching the accounts.
                </p>
                <div className="p-4 bg-surface-secondary border border-dashed border-border-default rounded-[var(--radius-card)] flex items-center justify-center">
                  <p className="text-[12px] text-text-tertiary">Drag and drop CSV here</p>
                </div>
              </div>
            </AppModal>
          </AppCard>
        </PageSection>

      </PageContent>
    </Page>
  );
}
