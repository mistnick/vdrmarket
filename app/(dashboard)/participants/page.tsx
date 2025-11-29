"use client";

import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Users,
  Upload,
  Download,
  Trash2,
  UserX,
  UserCheck,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  BarChart3,
  Mail,
  FileText,
  FolderInput,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useDataRoomContext } from "@/components/providers/dataroom-provider";

// Types
interface PendingInvitation {
  id: string;
  email: string;
  groupIds: string[];
  token: string;
  expiresAt: string;
  createdAt: string;
  status: "pending" | "expired";
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  lastSignIn: Date | null;
  interactions: number;
  groupId: string;
}

interface Group {
  id: string;
  name: string;
  type: string;
  role: string;
  status: "active" | "inactive";
  lastSignIn: Date | null;
  userCount: number;
  interactions: number;
  members: Member[];
}

// API response types
interface ApiUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: string | null;
  status?: "ACTIVE" | "INACTIVE" | "PENDING_INVITE";
  createdAt?: string;
  updatedAt?: string;
}

interface ApiGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  user: ApiUser;
}

interface ApiGroup {
  id: string;
  name: string;
  type: string;
  dataRoomId: string;
  createdAt: string;
  updatedAt: string;
  members: ApiGroupMember[];
}

interface ApiDataRoom {
  id: string;
  name: string;
  groups: ApiGroup[];
  _count: {
    documents: number;
    folders: number;
  };
}

// Transform API data to UI format
function transformApiGroupToGroup(apiGroup: ApiGroup, docCount: number): Group {
  const members: Member[] = apiGroup.members.map((m) => {
    let status: "active" | "inactive" | "pending" = "pending";
    
    // Map database status to UI status
    if (m.user.status === "ACTIVE") {
      status = "active";
    } else if (m.user.status === "INACTIVE") {
      status = "inactive";
    } else if (m.user.status === "PENDING_INVITE") {
      status = "pending";
    } else if (m.user.emailVerified) {
      // Fallback for backwards compatibility
      status = "active";
    }
    
    return {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role === "owner" ? "Administrator" : m.role === "admin" ? "Administrator" : "User",
      status,
      lastSignIn: m.user.emailVerified ? new Date(m.user.emailVerified) : null,
      interactions: docCount,
      groupId: apiGroup.id,
    };
  });

  const lastSignIn = members
    .filter((m) => m.lastSignIn)
    .sort((a, b) => (b.lastSignIn?.getTime() || 0) - (a.lastSignIn?.getTime() || 0))[0]?.lastSignIn || null;

  const totalInteractions = members.reduce((sum, m) => sum + m.interactions, 0);

  const hasAdmin = members.some((m) => m.role === "Administrator");

  return {
    id: apiGroup.id,
    name: apiGroup.name,
    type: apiGroup.type,
    role: hasAdmin ? "Administrator" : "User",
    status: "active",
    lastSignIn,
    userCount: members.length,
    interactions: totalInteractions,
    members,
  };
}

function ParticipantsContent() {
  const { setCurrentDataRoom } = useDataRoomContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [dataRooms, setDataRooms] = useState<ApiDataRoom[]>([]);
  const [selectedDataRoom, setSelectedDataRoom] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [activeTab, setActiveTab] = useState("participants");

  // Sync DataRoom context when selection changes
  useEffect(() => {
    if (selectedDataRoom) {
      const dr = dataRooms.find(d => d.id === selectedDataRoom);
      setCurrentDataRoom(selectedDataRoom, dr?.name ?? null);
    }
  }, [selectedDataRoom, dataRooms, setCurrentDataRoom]);

  // Dialog states
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [moveToGroupOpen, setMoveToGroupOpen] = useState(false);
  
  // Error dialog states
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [errorDialogEmailContent, setErrorDialogEmailContent] = useState<string | null>(null);
  const [showEmailContent, setShowEmailContent] = useState(false);
  
  // Confirmation dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState("");
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
  const [confirmDialogAction, setConfirmDialogAction] = useState<() => Promise<void>>(() => async () => {});

  // Form states
  const [newParticipant, setNewParticipant] = useState({ email: "", name: "", groupId: "" });
  const [newGroup, setNewGroup] = useState({ name: "", role: "User" });

  const hasSelection = selectedIds.size > 0;

  // Fetch data rooms
  const fetchDataRooms = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/datarooms", {
        credentials: "include"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error loading data rooms");
      }

      if (data.success && data.data) {
        setDataRooms(data.data);
        if (data.data.length > 0 && !selectedDataRoom) {
          setSelectedDataRoom(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching data rooms:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setInitialLoading(false);
    }
  }, [selectedDataRoom]);

  // Fetch groups for selected data room
  const fetchGroups = useCallback(async () => {
    if (!selectedDataRoom) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/datarooms/${selectedDataRoom}/groups`, {
        credentials: "include"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error loading groups");
      }

      if (data.success && data.data) {
        const dr = dataRooms.find((d) => d.id === selectedDataRoom);
        const docCount = dr?._count?.documents || 0;
        const transformedGroups = data.data.map((g: ApiGroup) => transformApiGroupToGroup(g, docCount));
        setGroups(transformedGroups);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [selectedDataRoom, dataRooms]);

  useEffect(() => {
    fetchDataRooms();
  }, [fetchDataRooms]);

  useEffect(() => {
    if (selectedDataRoom) {
      fetchGroups();
      fetchPendingInvitations();
    }
  }, [selectedDataRoom, fetchGroups]);

  // Fetch pending invitations
  const fetchPendingInvitations = useCallback(async () => {
    if (!selectedDataRoom) return;

    try {
      const response = await fetch(`/api/datarooms/${selectedDataRoom}/invitations`, {
        credentials: "include"
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPendingInvitations(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  }, [selectedDataRoom]);

  // Resend invitation
  const handleResendInvitation = async (invitationId: string) => {
    if (!selectedDataRoom) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/datarooms/${selectedDataRoom}/invitations/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invitationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend invitation");
      }

      await fetchPendingInvitations();
    } catch (err) {
      console.error("Error resending invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to resend invitation");
    } finally {
      setLoading(false);
    }
  };

  // Delete invitation
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!selectedDataRoom) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/datarooms/${selectedDataRoom}/invitations?invitationId=${invitationId}`,
        { method: "DELETE", credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete invitation");
      }

      await fetchPendingInvitations();
    } catch (err) {
      console.error("Error deleting invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to delete invitation");
    } finally {
      setLoading(false);
    }
  };

  // Manually activate a pending invitation
  const handleActivateInvitation = async (invitationId: string, email: string) => {
    if (!selectedDataRoom) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/datarooms/${selectedDataRoom}/invitations/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invitationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to activate user");
      }

      // Refresh both groups and pending invitations
      await fetchGroups();
      await fetchPendingInvitations();
      
      // Show success message
      alert(`User ${email} has been activated successfully!`);
    } catch (err) {
      console.error("Error activating invitation:", err);
      setErrorDialogMessage(err instanceof Error ? err.message : "Failed to activate user");
      setErrorDialogEmailContent(null);
      setShowEmailContent(false);
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation dialog
  const showConfirmDialog = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmDialogTitle(title);
    setConfirmDialogMessage(message);
    setConfirmDialogAction(() => action);
    setConfirmDialogOpen(true);
  };

  // Filter groups and members based on search
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        members: group.members.filter(
          (m) =>
            m.name?.toLowerCase().includes(term) ||
            m.email.toLowerCase().includes(term)
        ),
      }))
      .filter(
        (group) =>
          group.name.toLowerCase().includes(term) ||
          group.members.length > 0
      );
  }, [groups, searchTerm]);

  const toggleGroupExpand = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleSelection = (id: string, isGroup: boolean = false) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (isGroup) {
        const group = groups.find((g) => g.id === id);
        group?.members.forEach((m) => newSelected.delete(m.id));
      }
    } else {
      newSelected.add(id);
      if (isGroup) {
        const group = groups.find((g) => g.id === id);
        group?.members.forEach((m) => newSelected.add(m.id));
      }
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set<string>();
      groups.forEach((g) => {
        allIds.add(g.id);
        g.members.forEach((m) => allIds.add(m.id));
      });
      setSelectedIds(allIds);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.email || !newParticipant.groupId || !selectedDataRoom) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/vdr/${selectedDataRoom}/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: newParticipant.email,
          name: newParticipant.name,
          groupIds: [newParticipant.groupId],
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorDialogMessage(data.error || "Failed to invite participant");
        setErrorDialogEmailContent(null);
        setShowEmailContent(false);
        setErrorDialogOpen(true);
        return;
      }
      
      // Check if email was sent successfully
      if (data.emailSent === false && data.emailMessage) {
        // Invitation created but email failed
        setErrorDialogMessage("Invitation created but email could not be sent: " + (data.emailError || "Unknown error"));
        setErrorDialogEmailContent(data.emailMessage);
        setShowEmailContent(false);
        setErrorDialogOpen(true);
      }
      
      // Refresh groups and invitations
      await fetchGroups();
      await fetchPendingInvitations();
      setAddParticipantOpen(false);
      setNewParticipant({ email: "", name: "", groupId: "" });
    } catch (err) {
      console.error("Error inviting participant:", err);
      setErrorDialogMessage(err instanceof Error ? err.message : "Failed to invite participant");
      setErrorDialogEmailContent(null);
      setShowEmailContent(false);
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const newG: Group = {
      id: `group-${Date.now()}`,
      name: newGroup.name,
      type: "CUSTOM",
      role: newGroup.role,
      status: "active",
      lastSignIn: null,
      userCount: 0,
      interactions: 0,
      members: [],
    };
    setGroups([...groups, newG]);
    setLoading(false);
    setCreateGroupOpen(false);
    setNewGroup({ name: "", role: "User" });
  };

  const handleDelete = async () => {
    if (!hasSelection) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const newGroups = groups
      .filter((g) => !selectedIds.has(g.id))
      .map((g) => ({
        ...g,
        members: g.members.filter((m) => !selectedIds.has(m.id)),
      }));
    setGroups(newGroups);
    setSelectedIds(new Set());
    setLoading(false);
  };

  const handleDeactivate = async () => {
    if (!hasSelection) return;
    setLoading(true);
    setError(null);
    
    try {
      const memberIds = Array.from(selectedIds).filter((id) => {
        return groups.some((g) => g.members.some((m) => m.id === id));
      });

      if (memberIds.length === 0) {
        setError("Select at least one user to deactivate");
        setLoading(false);
        return;
      }

      const allMembers = groups.flatMap((g) => g.members);
      const selectedMembers = allMembers.filter((m) => memberIds.includes(m.id));
      const hasInactiveMembers = selectedMembers.some((m) => m.status === "inactive");

      const newIsActive = hasInactiveMembers;

      const results = await Promise.allSettled(
        memberIds.map((userId) =>
          fetch(`/api/users/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ isActive: newIsActive }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Error updating");
            }
            return res.json();
          })
        )
      );

      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (failures > 0) {
        const failedReasons = results
          .filter((r): r is PromiseRejectedResult => r.status === "rejected")
          .map((r) => r.reason?.message)
          .filter(Boolean);
        setError(`${successes} users updated, ${failures} failed: ${failedReasons.join(", ")}`);
      }

      await fetchGroups();
      await fetchPendingInvitations();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error updating user status:", err);
      setError(err instanceof Error ? err.message : "Error updating");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: "active" | "inactive" | "pending") => {
    const newIsActive = currentStatus === "inactive";
    
    // If deactivating, show confirmation dialog
    if (!newIsActive) {
      showConfirmDialog(
        "Deactivate User",
        "Are you sure you want to deactivate this user? They will no longer be able to access the data room.",
        async () => {
          await performToggleUserStatus(userId, newIsActive);
        }
      );
    } else {
      await performToggleUserStatus(userId, newIsActive);
    }
  };

  const performToggleUserStatus = async (userId: string, newIsActive: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newIsActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrorDialogMessage(data.error || "Error updating user status");
        setErrorDialogEmailContent(null);
        setShowEmailContent(false);
        setErrorDialogOpen(true);
        return;
      }

      await fetchGroups();
      await fetchPendingInvitations();
    } catch (err) {
      console.error("Error toggling user status:", err);
      setErrorDialogMessage(err instanceof Error ? err.message : "Error updating user status");
      setErrorDialogEmailContent(null);
      setShowEmailContent(false);
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Delete user from group
  const handleDeleteUser = async (userId: string, groupId: string) => {
    if (!confirm("Are you sure you want to remove this user from the group?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vdr/${selectedDataRoom}/groups/${groupId}/members?userId=${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setErrorDialogMessage(data.error || "Error removing user");
        setErrorDialogEmailContent(null);
        setShowEmailContent(false);
        setErrorDialogOpen(true);
        return;
      }

      await fetchGroups();
      await fetchPendingInvitations();
    } catch (err) {
      console.error("Error deleting user:", err);
      setErrorDialogMessage(err instanceof Error ? err.message : "Error removing user");
      setErrorDialogEmailContent(null);
      setShowEmailContent(false);
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Resend invitation to pending user
  const handleResendUserInvitation = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      // Find pending invitation for this email
      const invitation = pendingInvitations.find(inv => inv.email === email);
      
      if (invitation) {
        // Use existing resend endpoint
        const response = await fetch(`/api/datarooms/${selectedDataRoom}/invitations/resend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ invitationId: invitation.id }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          // Check if there's email content to show
          if (data.emailMessage) {
            setErrorDialogMessage(data.error || "Failed to send invitation email");
            setErrorDialogEmailContent(data.emailMessage);
            setShowEmailContent(false);
            setErrorDialogOpen(true);
          } else {
            setErrorDialogMessage(data.error || "Error resending invitation");
            setErrorDialogEmailContent(null);
            setShowEmailContent(false);
            setErrorDialogOpen(true);
          }
          return;
        }

        // Success but check if email was sent
        if (data.emailSent === false && data.emailMessage) {
          setErrorDialogMessage("Invitation created but email could not be sent: " + (data.emailError || "Unknown error"));
          setErrorDialogEmailContent(data.emailMessage);
          setShowEmailContent(false);
          setErrorDialogOpen(true);
        } else {
          alert("Invitation resent successfully!");
        }
      } else {
        setErrorDialogMessage("No pending invitation found for this user");
        setErrorDialogEmailContent(null);
        setShowEmailContent(false);
        setErrorDialogOpen(true);
      }
    } catch (err) {
      console.error("Error resending invitation:", err);
      setErrorDialogMessage(err instanceof Error ? err.message : "Error resending invitation");
      setErrorDialogEmailContent(null);
      setShowEmailContent(false);
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getToggleButtonState = () => {
    if (!hasSelection) return { label: "Deactivate", icon: UserX, action: "deactivate" };
    
    const memberIds = Array.from(selectedIds).filter((id) => 
      groups.some((g) => g.members.some((m) => m.id === id))
    );
    
    if (memberIds.length === 0) return { label: "Deactivate", icon: UserX, action: "deactivate" };
    
    const allMembers = groups.flatMap((g) => g.members);
    const selectedMembers = allMembers.filter((m) => memberIds.includes(m.id));
    const hasInactiveMembers = selectedMembers.some((m) => m.status === "inactive");
    
    if (hasInactiveMembers) {
      return { label: "Activate", icon: UserCheck, action: "activate" };
    }
    return { label: "Deactivate", icon: UserX, action: "deactivate" };
  };

  const toggleButtonState = getToggleButtonState();

  const handleExport = async () => {
    const csvContent = groups
      .flatMap((g) =>
        g.members.map((m) => `${m.name},${m.email},${g.name},${m.role},${m.status}`)
      )
      .join("\n");
    const blob = new Blob([`Name,Email,Group,Role,Status\n${csvContent}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatLastSignIn = (date: Date | null) => {
    if (!date) return "Never";
    return format(date, "d MMM yyyy, HH:mm", { locale: it });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
          <p className="text-muted-foreground">
            Manage users and groups with access to data rooms
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => {
                setInitialLoading(true);
                fetchDataRooms();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
          <p className="text-muted-foreground">
            Manage users and groups with access to data rooms
          </p>
        </div>

        {/* Data Room Selector */}
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAddParticipantOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add participants
        </Button>
        <Button variant="outline" onClick={() => setCreateGroupOpen(true)}>
          <Users className="mr-2 h-4 w-4" />
          Create group
        </Button>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          disabled={!hasSelection}
          onClick={handleDelete}
          className={hasSelection ? "text-destructive hover:text-destructive" : ""}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button
          variant="outline"
          disabled={!hasSelection || loading}
          onClick={handleDeactivate}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <toggleButtonState.icon className="mr-2 h-4 w-4" />
          )}
          {toggleButtonState.label}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search participants or groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Groups Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size > 0}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last access</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-center">Interactions</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <Fragment key={group.id}>
                  {/* Group Row */}
                  <TableRow
                    data-state={selectedIds.has(group.id) ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(group.id)}
                        onCheckedChange={() => toggleSelection(group.id, true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleGroupExpand(group.id)}
                      >
                        {expandedGroups.has(group.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.type === "ADMINISTRATOR" ? "default" : "secondary"}>
                        {group.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(group.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastSignIn(group.lastSignIn)}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {group.userCount}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {group.interactions}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setAddParticipantOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add participants
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedGroup(group);
                            setGroupSettingsOpen(true);
                          }}>
                            <Settings className="mr-2 h-4 w-4" />
                            Group settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Members Rows (expanded) */}
                  {expandedGroups.has(group.id) &&
                    group.members.map((member) => (
                      <TableRow
                        key={member.id}
                        data-state={selectedIds.has(member.id) ? "selected" : undefined}
                        className="bg-muted/30"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(member.id)}
                            onCheckedChange={() => toggleSelection(member.id)}
                          />
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 pl-6">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{member.name || "—"}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === "Administrator" ? "default" : "secondary"}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatLastSignIn(member.lastSignIn)}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center font-medium">
                          {member.interactions}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                View reports
                              </DropdownMenuItem>
                              {member.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => handleResendUserInvitation(member.email)}
                                  disabled={loading}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Resend invitation
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleUserStatus(member.id, member.status)}
                                disabled={loading}
                              >
                                {member.status === "inactive" ? (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                ) : (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteUser(member.id, member.groupId)}
                                disabled={loading}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </Fragment>
              ))}

              {filteredGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8" />
                      <p>No participants found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Pending Invitations ({pendingInvitations.length})
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Invitations that have been sent but not yet accepted
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Invited by</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      {invitation.createdBy.name || invitation.createdBy.email}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.createdAt), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expiresAt), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invitation.status === "expired" ? "destructive" : "secondary"}>
                        {invitation.status === "expired" ? "Expired" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleActivateInvitation(invitation.id, invitation.email)}
                            disabled={loading}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate manually
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResendInvitation(invitation.id)}
                            disabled={loading}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Resend invitation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteInvitation(invitation.id)}
                            disabled={loading}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Participant Dialog */}
      <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add participant</DialogTitle>
            <DialogDescription>
              Invite a new user to the data room
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Group *</Label>
              <Select
                value={newParticipant.groupId}
                onValueChange={(value) => setNewParticipant({ ...newParticipant, groupId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddParticipantOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParticipant} disabled={loading || !newParticipant.email || !newParticipant.groupId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create group</DialogTitle>
            <DialogDescription>
              Create a new group to organize participants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group name *</Label>
              <Input
                id="groupName"
                placeholder="e.g., Investors, Consultants..."
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupRole">Default role</Label>
              <Select
                value={newGroup.role}
                onValueChange={(value) => setNewGroup({ ...newGroup, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={loading || !newGroup.name}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Settings Dialog */}
      <Dialog open={groupSettingsOpen} onOpenChange={setGroupSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group settings</DialogTitle>
            <DialogDescription>
              Edit settings for {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Group name</Label>
              <Input defaultValue={selectedGroup?.name} />
            </div>
            <div className="space-y-2">
              <Label>Default role</Label>
              <Select defaultValue={selectedGroup?.role}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setGroupSettingsOpen(false)}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialogTitle}</DialogTitle>
            <DialogDescription>
              {confirmDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmDialogOpen(false);
                await confirmDialogAction();
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={(open) => {
        setErrorDialogOpen(open);
        if (!open) {
          setShowEmailContent(false);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>{errorDialogMessage}</AlertDescription>
            </Alert>
            
            {errorDialogEmailContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-email" className="text-sm font-medium">
                    Show email message content
                  </Label>
                  <Switch
                    id="show-email"
                    checked={showEmailContent}
                    onCheckedChange={setShowEmailContent}
                  />
                </div>
                
                {showEmailContent && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Email message that was attempted to send:
                    </Label>
                    <Textarea
                      readOnly
                      value={errorDialogEmailContent}
                      className="h-48 font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setErrorDialogOpen(false);
              setShowEmailContent(false);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ParticipantsPage() {
  return (
    <PermissionGuard
      requiredPermission={(p) => p.isAdministrator || p.canManageUsers || p.canViewGroupUsers}
      fallbackMessage="Non hai i permessi per gestire i partecipanti. Questa funzionalità è riservata agli amministratori."
    >
      <ParticipantsContent />
    </PermissionGuard>
  );
}
