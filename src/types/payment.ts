// src/types/payment.ts
export interface GSTDetails {
    /**
     * Customer's GST Identification Number
     */
    gstNumber: string | null;
    
    /**
     * GST amount applied to the payment in rupees
     */
    taxAmount: number;
    
    /**
     * GST tax percentage that was applied
     */
    taxPercentage: number;
    
    /**
     * Whether the customer provided a valid GST number
     */
    hasGST: boolean;
    
    /**
     * State GST component amount
     */
    sgstAmount?: number;
    
    /**
     * Central GST component amount
     */
    cgstAmount?: number;
    
    /**
     * Integrated GST component amount (for inter-state transactions)
     */
    igstAmount?: number;
    
    /**
     * Customer's billing state code
     */
    stateCode?: string;
    
    /**
     * Whether this is an inter-state transaction
     */
    isInterState?: boolean;
    
    /**
     * HSN/SAC code for the service
     */
    hsnSacCode?: string;
    
    /**
     * Place of supply as per GST rules
     */
    placeOfSupply?: string;
  }