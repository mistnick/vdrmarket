import { NextResponse } from 'next/server';

export async function GET() {
    // Mock analytics data – in a real implementation this would query the database
    const data = {
        totalViews: 1245,
        totalDownloads: 876,
        topDocuments: [
            { id: 'doc1', name: 'Quarterly Report Q1.pdf', views: 342 },
            { id: 'doc2', name: 'Financial Summary.xlsx', views: 210 },
        ],
    };
    return NextResponse.json(data);
}
