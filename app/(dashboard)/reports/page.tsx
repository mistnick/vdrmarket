import { auth } from "@/lib/auth";
import { generateVerificationReport } from "@/lib/reports-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db/prisma";

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user?.id) return <div>Unauthorized</div>;

    // Get user's team (first one for now)
    const teamMember = await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
    });

    if (!teamMember) {
        return <div className="p-8">You need to be part of a team to view reports.</div>;
    }

    const report = await generateVerificationReport(teamMember.teamId);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Verification Reports</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{report.totalAccesses}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{report.uniqueViewers}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.recentActivity.map((activity, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{activity.action}</TableCell>
                                        <TableCell>{activity.user}</TableCell>
                                        <TableCell>{activity.date.toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {report.topDocuments.map((doc, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{doc.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {doc.views} views
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
