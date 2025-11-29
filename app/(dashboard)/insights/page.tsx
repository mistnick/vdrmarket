"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";
import { PermissionGuard } from "@/components/shared/permission-guard";

function InsightsContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Insights"
        description="Track document activity, user engagement, and data room performance"
      />

      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,543</div>
            <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Document Access</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,328</div>
            <p className="text-xs text-gray-500 mt-1">+8% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">145</div>
            <p className="text-xs text-gray-500 mt-1">+22 new this month</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-gray-500 mt-1">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600">Document "Q4 Report.pdf" accessed by 12 users</span>
              <span className="ml-auto text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">New data room created: "Acquisition 2024"</span>
              <span className="ml-auto text-gray-400">5 hours ago</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">Secure link shared for "Financial Docs"</span>
              <span className="ml-auto text-gray-400">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Documents */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Most Accessed Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Q4 Financial Report.pdf", views: 342 },
              { name: "Product Roadmap 2024.docx", views: 289 },
              { name: "Team Handbook.pdf", views: 256 },
              { name: "Marketing Strategy.pptx", views: 198 },
            ].map((doc, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{doc.name}</span>
                </div>
                <span className="text-gray-500">{doc.views} views</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <PermissionGuard
      requiredPermission={(p) => p.isAdministrator || p.canViewGroupActivity}
      fallbackMessage="Non hai i permessi per visualizzare le statistiche. Questa funzionalità è riservata agli amministratori."
    >
      <InsightsContent />
    </PermissionGuard>
  );
}
