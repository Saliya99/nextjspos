"use client";

import { apiClient } from '../../lib/api';
import { ReportTable, FilterConfig } from '../../components/ReportTable';
import { TableColumn } from 'react-data-table-component';

interface PurchaseHistoryItem {
  date: string;
  invoice_id: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  price: number;
}

const columns: TableColumn<PurchaseHistoryItem>[] = [
  { name: 'Date', selector: (row) => row.date, sortable: true },
  { name: 'Invoice ID', selector: (row) => row.invoice_id, sortable: true },
  { name: 'Customer', selector: (row) => row.customer_name, sortable: true },
  { name: 'Product', selector: (row) => row.product_name, sortable: true },
  { name: 'Quantity', selector: (row) => Number(row.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), sortable: true },
  { name: 'Price', selector: (row) => Number(row.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sortable: true },
];

const filters: FilterConfig[] = [
  { key: 'customer_name', label: 'Customer Name', type: 'text' },
  { key: 'product_name', label: 'Product Name', type: 'text' },
  { key: 'start_date', label: 'Start Date', type: 'date' },
  { key: 'end_date', label: 'End Date', type: 'date' },
];

const today = new Date().toISOString().split('T')[0];
const defaultFilters = {
  customer_name: '',
  product_name: '',
  start_date: today,
  end_date: today,
};

export default function PurchaseHistoryReportPage() {
  return (
    <ReportTable<PurchaseHistoryItem>
      title="Customer Purchase History"
      subtitle="View and export all customer purchases"
      columns={columns}
      filters={filters}
      defaultFilters={defaultFilters}
      allowedRoles={["admin"]}
      fetchData={async (filters, page, perPage) => {
        const params: Parameters<typeof apiClient.getCustomerPurchaseHistory>[0] = {
          start_date: filters.start_date,
          end_date: filters.end_date,
          page,
          per_page: perPage,
          paginate: true,
        };
        if (filters.customer_name) params.customer_name = filters.customer_name;
        if (filters.product_name) params.product_name = filters.product_name;
        const response = await apiClient.getCustomerPurchaseHistory(params);
        return {
          data: response.result && Array.isArray(response.data) ? response.data : [],
          total: response.pagination?.total || (response.data ? response.data.length : 0),
        };
      }}
      fetchAllData={async (filters) => {
        const params: Parameters<typeof apiClient.getCustomerPurchaseHistory>[0] = {
          start_date: filters.start_date,
          end_date: filters.end_date,
          paginate: false,
        };
        if (filters.customer_name) params.customer_name = filters.customer_name;
        if (filters.product_name) params.product_name = filters.product_name;
        const response = await apiClient.getCustomerPurchaseHistory(params);
        return response.result && Array.isArray(response.data) ? response.data.map((item: PurchaseHistoryItem) => ({
          ...item,
          quantity: Number(item.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          price: Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        })) : [];
      }}
    />
  );
}