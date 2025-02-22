/**
 * Test data for Firestore emulator
 * This file contains sample data structures matching our application's schema
 */
export const dealsData = [
    {
        issuer: "City of Springfield",
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
        issuer: "County of Shelbyville",
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
        issuer: "Capital City School District",
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
//# sourceMappingURL=testData.js.map