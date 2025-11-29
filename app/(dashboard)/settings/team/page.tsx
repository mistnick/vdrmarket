"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Loader2,
  Crown,
} from "lucide-react";
import { format } from "date-fns";

interface GroupMember {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  group: {
    id: string;
    name: string;
    type: string;
  };
}

interface DataRoom {
  id: string;
  name: string;
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [dataRooms, setDataRooms] = useState<DataRoom[]>([]);
  const [selectedDataRoom, setSelectedDataRoom] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchDataRooms();
  }, []);

  useEffect(() => {
    if (selectedDataRoom) {
      fetchMembers();
    }
  }, [selectedDataRoom]);

  const fetchDataRooms = async () => {
    try {
      const response = await fetch("/api/datarooms");
      if (response.ok) {
        const data = await response.json();
        setDataRooms(data.data || []);
        if (data.data?.length > 0) {
          setSelectedDataRoom(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching data rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedDataRoom) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/datarooms/\${selectedDataRoom}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedDataRoom) return;

    try {
      setInviting(true);
      const response = await fetch(`/api/datarooms/\${selectedDataRoom}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        setInviteEmail("");
        setInviteRole("member");
        setShowInviteDialog(false);
        fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("An error occurred");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!selectedDataRoom) return;

    try {
      const response = await fetch(`/api/datarooms/\${selectedDataRoom}/members/\${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    if (!selectedDataRoom) return;

    try {
      const response = await fetch(`/api/datarooms/\${selectedDataRoom}/members/\${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      owner: { label: "Owner", className: "bg-purple-100 text-purple-800", icon: Crown },
      admin: { label: "Admin", className: "bg-blue-100 text-blue-800", icon: Shield },
      member: { label: "Member", className: "bg-green-100 text-green-800", icon: Users },
      viewer: { label: "Viewer", className: "bg-slate-100 text-slate-800", icon: Users },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.member;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading && dataRooms.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Room Members</h1>
        <p className="text-slate-600 mt-1">
          Manage members, roles, and access for your data rooms
        </p>
      </div>

      {/* Data Room Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="dataroom">Select Data Room</Label>
            <Select value={selectedDataRoom} onValueChange={setSelectedDataRoom}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a data room" />
              </SelectTrigger>
              <SelectContent>
                {dataRooms.map((dr) => (
                  <SelectItem key={dr.id} value={dr.id}>
                    {dr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Members</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {members.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Admins</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {members.filter((m) => m.role === "admin" || m.role === "owner").length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Data Rooms</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {dataRooms.length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                People who have access to this data room
              </CardDescription>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button disabled={!selectedDataRoom}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Member</DialogTitle>
                  <DialogDescription>
                    Add a new member to this data room
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - Can view documents</SelectItem>
                        <SelectItem value="member">Member - Can create and edit</SelectItem>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member.user.image ? (
                          <img
                            src={member.user.image}
                            alt={member.user.name || ""}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {(member.user.name || member.user.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {member.user.name || "Unknown"}
                          </p>
                          <p className="text-sm text-slate-600">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.group.name}</Badge>
                    </TableCell>
                    <TableCell>
                      {member.role === "owner" ? (
                        getRoleBadge(member.role)
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(member.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No members found. Add members to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
