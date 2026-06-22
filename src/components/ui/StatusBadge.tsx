import React from 'react';
import { AppBadge } from './AppBadge';
import { LeadStatus } from '../../lib/types';

export function StatusBadge({ status }: { status: LeadStatus }) {
  switch (status) {
    case 'won':
      return <AppBadge variant="success">Closed Won</AppBadge>;
    case 'lost':
      return <AppBadge variant="danger">Closed Lost</AppBadge>;
    case 'proposal':
      return <AppBadge variant="warning">Proposal</AppBadge>;
    case 'qualified':
      return <AppBadge variant="primary">Qualified</AppBadge>;
    case 'contacted':
      return <AppBadge variant="neutral">Contacted</AppBadge>;
    case 'new':
    default:
      return <AppBadge variant="neutral">New</AppBadge>;
  }
}
