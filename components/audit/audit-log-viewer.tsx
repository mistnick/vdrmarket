"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, Search, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
    id: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata: any;
    ipAddress: string | null;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    } | null;
    team: {
        name: string;
    } | null;
}

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [resourceTypeFilter, setResourceTypeFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "50",
            });

            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (actionFilter) params.append("action", actionFilter);
            if (resourceTypeFilter) params.append("resourceType", resourceTypeFilter);

            const response = await fetch(`/api/audit-logs?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch logs");
            }

            setLogs(data.logs);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, startDate, endDate, actionFilter, resourceTypeFilter]);

    const handleExport = async (format: "csv" | "json") => {
        setExporting(true);

        try {
            const params = new URLSearchParams({ format });
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (actionFilter) params.append("action", actionFilter);
            if (resourceTypeFilter) params.append("resourceType", resourceTypeFilter);

            const response = await fetch(`/api/audit-logs/export?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Export failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes("CREATED")) return "bg-green-100 text-green-800";
        if (action.includes("DELETED")) return "bg-red-100 text-red-800";
        if (action.includes("UPDATED")) return "bg-blue-100 text-blue-800";
        if (action.includes("VIEWED") || action.includes("ACCESSED"))
            return "bg-gray-100 text-gray-800";
        if (action.includes("LOGIN")) return "bg-purple-100 text-purple-800";
        return "bg-gray-100 text-gray-800";
    };

    const filteredLogs = logs.filter((log) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            log.action.toLowerCase().includes(search) ||
            log.resourceType.toLowerCase().includes(search) ||
            log.user?.email.toLowerCase().includes(search) ||
            log.user?.name?.toLowerCase().includes(search)
        );
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Audit Logs</CardTitle>
                        <CardDescription>
                            View and export comprehensive audit trail of all system activities
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport("csv")}
                            disabled={exporting}
                        >
                            {exporting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Export CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport("json")}
                            disabled={exporting}
                        >
                            {exporting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Export JSON
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div>
                        <Label htmlFor="action">Action</Label>
                        <Select
                            value={actionFilter}
                            onValueChange={(value) => {
                                setActionFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=" ">All actions</SelectItem>
                                <SelectItem value="LOGIN">Login</SelectItem>
                                <SelectItem value="LOGOUT">Logout</SelectItem>
                                <SelectItem value="DOCUMENT_VIEWED">Document Viewed</SelectItem>
                                <SelectItem value="DOCUMENT_DOWNLOADED">
                                    Document Downloaded
                                </SelectItem>
                                <SelectItem value="PERMISSION_CHANGED">
                                    Permission Changed
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="resourceType">Resource Type</Label>
                        <Select
                            value={resourceTypeFilter}
                            onValueChange={(value) => {
                                setResourceTypeFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=" ">All types</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="folder">Folder</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="dataroom">Data Room</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {filteredLogs.length} of {total} total logs
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchLogs}
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Table */}
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No audit logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm">
                                            {formatDistanceToNow(new Date(log.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {log.user?.name || "System"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {log.user?.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getActionColor(log.action)}>
                                                {log.action.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm capitalize">
                                                    {log.resourceType}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {log.resourceId.slice(0, 8)}...
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-mono">
                                            {log.ipAddress || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                            {log.metadata && Object.keys(log.metadata).length > 0
                                                ? JSON.stringify(log.metadata)
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1 || loading}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
