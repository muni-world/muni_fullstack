/**
 * Test data for Firestore emulator
 * This file contains sample data structures matching our application's schema
 */
/**
 * Raw deals data containing all fields
 */
const rawDealsData = [
    {
        series_name_obligor: "City of Springfield",
        total_par: 10000000,
        underwriter_fee: {
            total: 50000
        },
        os_type: "Competitive",
        lead_managers: ["Goldman Sachs", "JP Morgan"],
        co_managers: ["Bank of America", "Wells Fargo"],
        counsels: ["Law Firm A", "Law Firm B"],
        municipal_advisors: ["Advisory Firm X"],
        underwriters_advisors: ["Advisory Firm Y"],
        emma_os_url: "https://emma.msrb.org/P11111111"
    },
    {
        series_name_obligor: "County of Shelbyville",
        total_par: 5000000,
        underwriter_fee: {
            total: 25000
        },
        os_type: "Negotiated",
        lead_managers: ["Morgan Stanley"],
        co_managers: ["Citigroup"],
        counsels: ["Law Firm C"],
        municipal_advisors: ["Advisory Firm Z"],
        underwriters_advisors: ["Advisory Firm W"],
        emma_os_url: "https://emma.msrb.org/P22222222"
    },
    {
        series_name_obligor: "Capital City School District",
        total_par: 15000000,
        underwriter_fee: {
            total: 75000
        },
        os_type: "Private Placement",
        lead_managers: ["Bank of America"],
        co_managers: ["Goldman Sachs"],
        counsels: ["Law Firm D"],
        municipal_advisors: ["Advisory Firm X"],
        underwriters_advisors: ["Advisory Firm Y"],
        emma_os_url: "https://emma.msrb.org/P33333333"
    }
];
/**
 * Filter deal data based on user type
 * @param deal - The deal data to filter
 * @param userType - The type of user accessing the data
 * @returns Filtered deal data based on user type
 */
const filterDealData = (deal, userType) => {
    // Base data available to all users
    const baseData = {
        series_name_obligor: deal.series_name_obligor,
        total_par: 0,
        underwriter_fee: {
            total: 0
        },
        emma_os_url: deal.emma_os_url,
        lead_managers: [], // Always include lead_managers array, even if empty
    };
    // Add additional data for authenticated users
    if (userType === "authenticated" || userType === "subscriber") {
        return {
            ...baseData,
            total_par: deal.total_par,
            underwriter_fee: {
                total: deal.underwriter_fee.total
            },
            lead_managers: deal.lead_managers || [],
            ...(userType === "subscriber" && {
                os_type: deal.os_type,
                co_managers: deal.co_managers,
                counsels: deal.counsels,
                municipal_advisors: deal.municipal_advisors,
                underwriters_advisors: deal.underwriters_advisors,
            }),
        };
    }
    // Return base data for unauthenticated users
    return baseData;
};
/**
 * Group deals by manager and calculate totals
 */
const groupDealsByManager = (deals) => {
    const managerMap = new Map();
    // Group deals by lead manager
    deals.forEach(deal => {
        if (deal.lead_managers && deal.lead_managers.length > 0) {
            deal.lead_managers.forEach(manager => {
                if (!managerMap.has(manager)) {
                    managerMap.set(manager, []);
                }
                managerMap.get(manager)?.push(deal);
            });
        }
    });
    // Convert map to ManagerData array
    return Array.from(managerMap.entries()).map(([manager, managerDeals]) => ({
        manager,
        totalPar: managerDeals.reduce((sum, deal) => sum + deal.total_par, 0),
        underwriterFee: managerDeals.reduce((sum, deal) => sum + (deal.underwriter_fee?.total || 0), 0),
        deals: managerDeals,
    }));
};
/**
 * Get filtered deals data based on user type
 * @param userType - The type of user accessing the data
 * @returns Array of filtered manager data
 */
export const getFilteredDealsData = (userType = "unauthenticated") => {
    const filteredDeals = rawDealsData.map(deal => filterDealData(deal, userType));
    return groupDealsByManager(filteredDeals);
};
//# sourceMappingURL=testData.js.map