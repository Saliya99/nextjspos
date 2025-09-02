"use client";

import { useState, useEffect, useRef, ChangeEvent, ReactNode } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { exportToCSV, exportToExcel } from "../lib/exportService";
import ProtectedRoute from "./ProtectedRoute";
import Sidebar from "./layout/SideBar";
import Header from "./layout/Header";
import { ChartBarIcon, ArrowDownTrayIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "date";
  placeholder?: string;
}

interface ReportTableProps<T> {
  title: string;
  subtitle: string;
  columns: TableColumn<T>[];
  filters: FilterConfig[];
  fetchData: (filters: Record<string, string>, page: number, perPage: number) => Promise<{ data: T[]; total: number }>;
  fetchAllData: (filters: Record<string, string>) => Promise<T[]>;
  defaultFilters: Record<string, string>;
  allowedRoles?: ("admin" | "cashier" | "storekeeper")[];
  children?: ReactNode;
}

export function ReportTable<T>({
  title,
  subtitle,
  columns,
  filters,
  fetchData,
  fetchAllData,
  defaultFilters,
  allowedRoles = ["admin"] as ("admin" | "cashier" | "storekeeper")[],
  children,
}: ReportTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterState, setFilterState] = useState<Record<string, string>>(defaultFilters);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const toggleExportDropdown = () => setShowExportDropdown((v) => !v);
  const closeExportDropdown = () => setShowExportDropdown(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const fetchTableData = async (pageArg = page, perPageArg = perPage) => {
    setLoading(true);
    try {
      const { data, total } = await fetchData(filterState, pageArg, perPageArg);
      setData(data);
      setTotalRows(total);
    } catch {
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTableData = async () => {
    return await fetchAllData(filterState);
  };

  const handleExport = async (
    exportFn: (data: any[], options: any) => Promise<void>,
    options: any,
    alertMsg = 'Failed to export data. Please try again.'
  ) => {
    setIsExporting(true);
    try {
      const allData = await fetchAllTableData();
      if (!allData.length) {
        toast.error('No data to export');
        return;
      }
      await exportFn(allData, options);
      toast.success('Export successful!');
    } catch {
      toast.error(alertMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToCSV = async () => {
    await handleExport(exportToCSV, {
      filename: `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

  const handleExportToExcel = async () => {
    await handleExport(exportToExcel, {
      filename: `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: title.replace(/\s+/g, ''),
    });
  };

  useEffect(() => {
    fetchTableData();
  }, [page, perPage]);

  useEffect(() => {
    fetchTableData(1, perPage);
  }, [filterState]);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        showExportDropdown &&
        exportDropdownRef.current &&
        exportDropdownRef.current.contains &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportDropdown]);

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} subtitle={subtitle} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="card mb-6">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {children}
                  <div className="relative export-dropdown" ref={exportDropdownRef}>
                    <button
                      onClick={toggleExportDropdown}
                      className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 me-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 text-gray-500 me-2" />
                          Export
                          <ChevronDownIcon className="w-3 h-3 ms-2" />
                        </>
                      )}
                    </button>
                    {showExportDropdown && (
                      <div className="absolute right-0 mt-2 z-10 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow-sm">
                        <ul className="p-3 space-y-1 text-sm text-gray-700">
                          <li>
                            <button
                              onClick={() => {
                                handleExportToCSV();
                                closeExportDropdown();
                              }}
                              disabled={isExporting}
                              className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4 me-2 text-green-600" />
                              <span className="text-sm font-medium text-gray-900">Export to CSV</span>
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                handleExportToExcel();
                                closeExportDropdown();
                              }}
                              disabled={isExporting}
                              className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4 me-2 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">Export to Excel</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body border-b pb-4 mb-4">
                <div className={`grid grid-cols-1 md:grid-cols-${filters.length} gap-4`}>
                  {filters.map((filter) => (
                    <input
                      key={filter.key}
                      type={filter.type}
                      placeholder={filter.placeholder || filter.label}
                      className="input w-full"
                      value={filterState[filter.key] || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange(filter.key, e.target.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="card-body">
                <DataTable
                  columns={columns}
                  data={data}
                  progressPending={loading}
                  pagination
                  paginationServer
                  paginationTotalRows={totalRows}
                  onChangePage={setPage}
                  onChangeRowsPerPage={setPerPage}
                  highlightOnHover
                  pointerOnHover
                  responsive
                  noDataComponent={<div className="text-center py-8">No data found</div>}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}