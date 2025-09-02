'use client'
import React, { useState,useEffect } from 'react';
import { XMarkIcon,BuildingOfficeIcon,TrashIcon,ArrowPathIcon} from '@heroicons/react/24/outline'
import {getCookie,setCookie } from 'react-use-cookie';
import DataTable from 'react-data-table-component';
import { HoldInvoice } from '../../types';
import { HoldInvoiceModelsProps } from '../../types';

function HoldInvoiceModels({ onSelectInvoiceIndex }: HoldInvoiceModelsProps) {

    const handleInvoiceClick = (index: number) => {
      onSelectInvoiceIndex(index); // Pass the index to parent
    };

    // Handler updates the model based on user input (view)
    const [invoices, setInvoices] = useState<HoldInvoice[]>([]);
    const [showHoldInvoiceModal, setShowHoldInvoiceModal] = useState(false)
    useEffect(() => {
      updateHoldInvoice()
      // Set up interval to check for cookie changes more frequently
      const interval = setInterval(updateHoldInvoice, 100)
      return () => clearInterval(interval)
    }, []);

    const updateHoldInvoice = async () =>{
      const stored = JSON.parse(getCookie('holdInvoice') || '[]');
      setInvoices(stored);
    }

     // Define columns for react-data-table-component
  const columns = [
    {
      name: 'Customer',
      selector: (row: HoldInvoice) => {
        // If customer is an object, show a readable value:
        return typeof row.customer === 'object' && row.customer !== null
          ? `${row.customer.first_Name || ''} ${row.customer.last_Name || ''}`
          : 'Walk-in Customer';
      },
      sortable: true,
    },
    {
      name: 'VAT %',
      selector: (row: HoldInvoice) => row.vatPercentage || 0,
      sortable: true,
    },
    {
      name: 'Discount %',
      selector: (row: HoldInvoice) => row.discountPercentage || 0,
      sortable: true,
      cell: (row: HoldInvoice) => (
        <span>{row.discountPercentage || 0}%</span>
      ),
    },
    {
      name: 'Total',
      selector: (row: HoldInvoice) => row.grandTotal || 0,
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (_: HoldInvoice, index: number) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              handleInvoiceClick(index)
              setShowHoldInvoiceModal(false)
              removeInvoiceByIndex(index)
            }}
            className="btn btn-sm btn-success"
            title="Bill Again"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              removeInvoiceByIndex(index)
            }}
            className="btn btn-sm btn-error text-red-600 hover:text-red-800"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    }    
  ];

  const removeInvoiceByIndex = (indexToRemove: number) => {
    setShowHoldInvoiceModal(false)
    // Parse the stored invoices array from cookie or empty array if none
    const storedInvoices = getCookie('holdInvoice') ? JSON.parse(getCookie('holdInvoice')) : [];
  
    // Remove the invoice at the given index
    if (indexToRemove >= 0 && indexToRemove < storedInvoices.length) {
      storedInvoices.splice(indexToRemove, 1); // Remove 1 element at indexToRemove
    } else {
      
      console.warn('Invalid invoice index:', indexToRemove);
    }
  
    // Update the cookie with the modified invoice array
    setCookie('holdInvoice', JSON.stringify(storedInvoices));
    // Update local state immediately
    setInvoices(storedInvoices);
  }
    return (
        <div>
        <button
          // disabled={loading || cart.length === 0 }
          className="btn btn-warning w-full"
          onClick={() => {setShowHoldInvoiceModal(true);updateHoldInvoice();}}
        >
          {'HOLD LIST ('+invoices.length+')' }
        </button>

        {showHoldInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Hold Invoice List</h3>
              <button
                onClick={() => setShowHoldInvoiceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2">
            <div className="card">
              <div className="card-body p-0">
                    {invoices ? (
                      <DataTable
                      columns={columns}
                      data={invoices} 
                      pagination
                      highlightOnHover
                      pointerOnHover
                      striped
                    />
                    ) : (
                      <div className="text-center py-12">
                        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Hold Invoice</h3>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

  export default HoldInvoiceModels;