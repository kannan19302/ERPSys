import { defineModule, defineResource } from '@unerp/framework';

export const exchangeRateResource = defineResource({
  name: 'exchange-rates',
  labelSingular: 'Exchange Rate',
  labelPlural: 'Exchange Rates',
  endpoint: '/advanced-finance/exchange-rates',
  titleField: 'fromCurrency',
  permissions: { read: 'finance.treasury.read', create: 'finance.treasury.create' },
  fields: [
    { name: 'fromCurrency', label: 'From Currency', type: 'text', required: true, min: 3, max: 3 },
    { name: 'toCurrency', label: 'To Currency', type: 'text', required: true, min: 3, max: 3 },
    { name: 'rate', label: 'Rate', type: 'number', required: true, min: 0 },
    { name: 'date', label: 'Effective Date', type: 'date' },
    { name: 'source', label: 'Source', type: 'text', readOnly: true },
  ],
  list: { columns: ['fromCurrency', 'toCurrency', 'rate', 'effectiveDate', 'source'], searchable: true, pageSize: 25, defaultSort: { field: 'effectiveDate', direction: 'desc' } },
});

export const financialPeriodResource = defineResource({
  name: 'financial-periods',
  labelSingular: 'Financial Period',
  labelPlural: 'Financial Periods',
  endpoint: '/advanced-finance/financial-periods',
  titleField: 'name',
  permissions: { read: 'finance.period.read', create: 'finance.period.create' },
  status: { field: 'status', tones: { OPEN: 'success', CLOSED: 'neutral' } },
  fields: [
    { name: 'name', label: 'Period Name', type: 'text', required: true },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', readOnly: true, options: [{ value: 'OPEN', label: 'Open' }, { value: 'CLOSED', label: 'Closed' }] },
  ],
  list: { columns: ['name', 'startDate', 'endDate', 'status'], searchable: true, pageSize: 25, defaultSort: { field: 'startDate', direction: 'desc' } },
});

export const advancedFinanceModule = defineModule({ id: 'advanced-finance', title: 'Advanced Finance', basePath: '/finance/advanced', permission: 'finance.treasury.read', resources: [exchangeRateResource, financialPeriodResource] });
