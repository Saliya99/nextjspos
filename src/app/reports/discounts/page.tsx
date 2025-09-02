"use client";

import { apiClient } from '../../lib/api';
import { DiscountReportItem } from '../../types';
import { ReportTable, FilterConfig } from '../../components/ReportTable';
import { TableColumn } from 'react-data-table-component';

const columns: TableColumn<DiscountReportItem>[] = [
  { name: 'Date/Time', selector: (row) => row.date_time, sortable: true },
  { name: 'Invoice ID', selector: (row) => row.invoice_id, sortable: true },
  { name: 'Product', selector: (row) => row.product_name, sortable: true },
  { name: 'Original Price', selector: (row) => Number(row.original_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sortable: true },
  { name: 'Discount Amount', selector: (row) => Number(row.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sortable: true },
  { name: 'Final Price', selector: (row) => Number(row.final_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sortable: true },
  { name: 'Employee/Cashier', selector: (row) => row.employee, sortable: true },
  { name: 'Customer', selector: (row) => row.customer, sortable: true },
];

const filters: FilterConfig[] = [
  { key: 'invoice_id', label: 'Invoice ID', type: 'text' },
  { key: 'product_name', label: 'Product Name', type: 'text' },
  { key: 'employee', label: 'Employee/Cashier', type: 'text' },
  { key: 'customer', label: 'Customer', type: 'text' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date', type: 'date' },
];

const today = new Date().toISOString().split('T')[0];
const defaultFilters = {
  invoice_id: '',
  product_name: '',
  employee: '',
  customer: '',
  start_date: today,
  end_date: today,
};

export default function DiscountListPage() {
  return (
    <ReportTable<DiscountReportItem>
      title="Discount List"
      subtitle="View and export all discounts"
      columns={columns}
      filters={filters}
      defaultFilters={defaultFilters}
      allowedRoles={["admin"]}
      fetchData={async (filters, page, perPage) => {
        const params: Parameters<typeof apiClient.getDiscountReport>[0] = {
          start_date: filters.start_date,
          end_date: filters.end_date,
          page,
          per_page: perPage,
          paginate: true,
        };
        if (filters.invoice_id) params.invoice_id = String(filters.invoice_id);
        if (filters.product_name) params.product_name = String(filters.product_name);
        if (filters.employee) params.employee = String(filters.employee);
        if (filters.customer) params.customer = String(filters.customer);
        const response = await apiClient.getDiscountReport(params);
        return {
          data: response.result && Array.isArray(response.data) ? response.data : [],
          total: response.pagination?.total || (response.data ? response.data.length : 0),
        };
      }}
      fetchAllData={async (filters) => {
        const params: Parameters<typeof apiClient.getDiscountReport>[0] = {
          start_date: filters.start_date,
          end_date: filters.end_date,
          paginate: false,
        };
        if (filters.invoice_id) params.invoice_id = String(filters.invoice_id);
        if (filters.product_name) params.product_name = String(filters.product_name);
        if (filters.employee) params.employee = String(filters.employee);
        if (filters.customer) params.customer = String(filters.customer);
        const response = await apiClient.getDiscountReport(params);
        return response.result && Array.isArray(response.data) ? response.data.map((item: DiscountReportItem) => ({
          ...item,
          original_price: Number(item.original_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          discount_amount: Number(item.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          final_price: Number(item.final_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        })) : [];
      }}
    />
  );
}