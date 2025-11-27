"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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

// Types
interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  lastSignIn: Date | null;
  interactions: number;
  teamId?: string;
}

interface Team {
  id: string;
  name: string;
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
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  user: ApiUser;
}

interface ApiTeam {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  members: ApiTeamMember[];
  _count: {
    documents: number;
    folders: number;
    dataRooms: number;
  };
}

// Transform API data to UI format
function transformApiTeamToTeam(apiTeam: ApiTeam): Team {
  const members: Member[] = apiTeam.members.map((m) => {
    // Determina lo stato: inactive se isActive è false, altrimenti active/pending in base a emailVerified
    let status: "active" | "inactive" | "pending" = "pending";
    if (m.user.isActive === false) {
      status = "inactive";
    } else if (m.user.emailVerified) {
      status = "active";
    }
    
    return {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role === "owner" ? "Administrator" : m.role === "admin" ? "Administrator" : "User",
      status,
      lastSignIn: m.user.emailVerified ? new Date(m.user.emailVerified) : null,
      interactions: apiTeam._count.documents + apiTeam._count.folders + apiTeam._count.dataRooms,
      teamId: apiTeam.id,
    };
  });

  // Calculate team-level aggregates
  const lastSignIn = members
    .filter((m) => m.lastSignIn)
    .sort((a, b) => (b.lastSignIn?.getTime() || 0) - (a.lastSignIn?.getTime() || 0))[0]?.lastSignIn || null;

  const totalInteractions = members.reduce((sum, m) => sum + m.interactions, 0);

  // Find the highest role in the team
  const hasAdmin = members.some((m) => m.role === "Administrator");

  return {
    id: apiTeam.id,
    name: apiTeam.name,
    role: hasAdmin ? "Administrator" : "User",
    status: "active",
    lastSignIn,
    userCount: members.length,
    interactions: totalInteractions,
    members,
  };
}

export default function ParticipantsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [moveToTeamOpen, setMoveToTeamOpen] = useState(false);

  // Form states
  const [newParticipant, setNewParticipant] = useState({ email: "", name: "", role: "User", teamId: "" });
  const [newTeam, setNewTeam] = useState({ name: "", role: "User" });

  const hasSelection = selectedIds.size > 0;

  // Fetch teams from API
  const fetchTeams = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/teams");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore nel caricamento dei team");
      }

      if (data.success && data.data) {
        const transformedTeams = data.data.map(transformApiTeamToTeam);
        setTeams(transformedTeams);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Filter teams and members based on search
  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const term = searchTerm.toLowerCase();
    return teams
      .map((team) => ({
        ...team,
        members: team.members.filter(
          (m) =>
            m.name?.toLowerCase().includes(term) ||
            m.email.toLowerCase().includes(term)
        ),
      }))
      .filter(
        (team) =>
          team.name.toLowerCase().includes(term) ||
          team.members.length > 0
      );
  }, [teams, searchTerm]);

  const toggleTeamExpand = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const toggleSelection = (id: string, isTeam: boolean = false) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (isTeam) {
        const team = teams.find((t) => t.id === id);
        team?.members.forEach((m) => newSelected.delete(m.id));
      }
    } else {
      newSelected.add(id);
      if (isTeam) {
        const team = teams.find((t) => t.id === id);
        team?.members.forEach((m) => newSelected.add(m.id));
      }
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set<string>();
      teams.forEach((t) => {
        allIds.add(t.id);
        t.members.forEach((m) => allIds.add(m.id));
      });
      setSelectedIds(allIds);
    }
  };

  const handleAddParticipant = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setAddParticipantOpen(false);
    setNewParticipant({ email: "", name: "", role: "User", teamId: "" });
  };

  const handleCreateTeam = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const newT: Team = {
      id: `team-${Date.now()}`,
      name: newTeam.name,
      role: newTeam.role,
      status: "active",
      lastSignIn: null,
      userCount: 0,
      interactions: 0,
      members: [],
    };
    setTeams([...teams, newT]);
    setLoading(false);
    setCreateTeamOpen(false);
    setNewTeam({ name: "", role: "User" });
  };

  const handleDelete = async () => {
    if (!hasSelection) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const newTeams = teams
      .filter((t) => !selectedIds.has(t.id))
      .map((t) => ({
        ...t,
        members: t.members.filter((m) => !selectedIds.has(m.id)),
      }));
    setTeams(newTeams);
    setSelectedIds(new Set());
    setLoading(false);
  };

  const handleDeactivate = async () => {
    if (!hasSelection) return;
    setLoading(true);
    setError(null);
    
    try {
      // Ottieni gli ID degli utenti selezionati (escludendo i team)
      const memberIds = Array.from(selectedIds).filter((id) => {
        // Controlla se l'ID appartiene a un membro e non a un team
        return teams.some((t) => t.members.some((m) => m.id === id));
      });

      if (memberIds.length === 0) {
        setError("Seleziona almeno un utente da disattivare");
        setLoading(false);
        return;
      }

      // Controlla se ci sono utenti già inattivi (per decidere se attivare o disattivare)
      const allMembers = teams.flatMap((t) => t.members);
      const selectedMembers = allMembers.filter((m) => memberIds.includes(m.id));
      const hasInactiveMembers = selectedMembers.some((m) => m.status === "inactive");

      // Se tutti sono attivi -> disattiva, se ce ne sono di inattivi -> attiva
      const newIsActive = hasInactiveMembers;

      // Esegui le chiamate API per ogni utente selezionato
      const results = await Promise.allSettled(
        memberIds.map((userId) =>
          fetch(`/api/users/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: newIsActive }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "Errore durante l'aggiornamento");
            }
            return res.json();
          })
        )
      );

      // Conta successi e fallimenti
      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures = results.filter((r) => r.status === "rejected").length;

      if (failures > 0) {
        const failedReasons = results
          .filter((r): r is PromiseRejectedResult => r.status === "rejected")
          .map((r) => r.reason?.message)
          .filter(Boolean);
        setError(`${successes} utenti aggiornati, ${failures} falliti: ${failedReasons.join(", ")}`);
      }

      // Ricarica i dati
      await fetchTeams();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error updating user status:", err);
      setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento");
    } finally {
      setLoading(false);
    }
  };

  // Handler per attivare/disattivare un singolo utente
  const handleToggleUserStatus = async (userId: string, currentStatus: "active" | "inactive" | "pending") => {
    setLoading(true);
    setError(null);

    try {
      const newIsActive = currentStatus === "inactive";
      
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newIsActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Errore durante l'aggiornamento");
      }

      // Ricarica i dati
      await fetchTeams();
    } catch (err) {
      console.error("Error toggling user status:", err);
      setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento");
    } finally {
      setLoading(false);
    }
  };

  // Determina il testo del pulsante in base allo stato degli utenti selezionati
  const getToggleButtonState = () => {
    if (!hasSelection) return { label: "Deactivate", icon: UserX, action: "deactivate" };
    
    const memberIds = Array.from(selectedIds).filter((id) => 
      teams.some((t) => t.members.some((m) => m.id === id))
    );
    
    if (memberIds.length === 0) return { label: "Deactivate", icon: UserX, action: "deactivate" };
    
    const allMembers = teams.flatMap((t) => t.members);
    const selectedMembers = allMembers.filter((m) => memberIds.includes(m.id));
    const hasInactiveMembers = selectedMembers.some((m) => m.status === "inactive");
    
    if (hasInactiveMembers) {
      return { label: "Activate", icon: UserCheck, action: "activate" };
    }
    return { label: "Deactivate", icon: UserX, action: "deactivate" };
  };

  const toggleButtonState = getToggleButtonState();

  const handleExport = async () => {
    const csvContent = teams
      .flatMap((t) =>
        t.members.map((m) => `${m.name},${m.email},${t.name},${m.role},${m.status}`)
      )
      .join("\n");
    const blob = new Blob([`Name,Email,Team,Role,Status\n${csvContent}`], {
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
    if (!date) return "Mai";
    return format(date, "d MMM yyyy, HH:mm", { locale: it });
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Caricamento team...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partecipanti</h1>
          <p className="text-muted-foreground">
            Gestisci utenti e team con accesso alla data room
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
                fetchTeams();
              }}
            >
              Riprova
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
          <h1 className="text-2xl font-bold tracking-tight">Partecipanti</h1>
          <p className="text-muted-foreground">
            Gestisci utenti e team con accesso alla data room
          </p>
        </div>

        {/* Global Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setAddParticipantOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add participants
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTeamSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Open team settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BarChart3 className="mr-2 h-4 w-4" />
              View reports
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Resend invitation
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="mr-2 h-4 w-4" />
              Send document updates
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMoveToTeamOpen(true)}>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAddParticipantOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add participants
        </Button>
        <Button variant="outline" onClick={() => setCreateTeamOpen(true)}>
          <Users className="mr-2 h-4 w-4" />
          Create team
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
          placeholder="Cerca partecipanti o team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams Table */}
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
                <TableHead>Team</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ultimo accesso</TableHead>
                <TableHead className="text-center">Utenti</TableHead>
                <TableHead className="text-center">Interazioni</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <>
                  {/* Team Row */}
                  <TableRow
                    key={team.id}
                    data-state={selectedIds.has(team.id) ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(team.id)}
                        onCheckedChange={() => toggleSelection(team.id, true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleTeamExpand(team.id)}
                      >
                        {expandedTeams.has(team.id) ? (
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
                        {team.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.role === "Administrator" ? "default" : "secondary"}>
                        {team.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(team.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastSignIn(team.lastSignIn)}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {team.userCount}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {team.interactions}
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
                            setSelectedTeam(team);
                            setTeamSettingsOpen(true);
                          }}>
                            <Settings className="mr-2 h-4 w-4" />
                            Open team settings
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View reports
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend invitation
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Send document updates
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMoveToTeamOpen(true)}>
                            <FolderInput className="mr-2 h-4 w-4" />
                            Move to team
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              // Seleziona tutti i membri del team e poi esegui deactivate
                              const memberIds = team.members.map(m => m.id);
                              setSelectedIds(new Set(memberIds));
                            }}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate all members
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Members Rows (expanded) */}
                  {expandedTeams.has(team.id) &&
                    team.members.map((member) => (
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
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Send document updates
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setMoveToTeamOpen(true)}>
                                <FolderInput className="mr-2 h-4 w-4" />
                                Move to team
                              </DropdownMenuItem>
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
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </>
              ))}

              {filteredTeams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8" />
                      <p>Nessun partecipante trovato</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Participant Dialog */}
      <Dialog open={addParticipantOpen} onOpenChange={setAddParticipantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi partecipante</DialogTitle>
            <DialogDescription>
              Invita un nuovo utente alla data room
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@esempio.com"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome completo"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Ruolo</Label>
              <Select
                value={newParticipant.role}
                onValueChange={(value) => setNewParticipant({ ...newParticipant, role: value })}
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
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={newParticipant.teamId}
                onValueChange={(value) => setNewParticipant({ ...newParticipant, teamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddParticipantOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleAddParticipant} disabled={loading || !newParticipant.email}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea team</DialogTitle>
            <DialogDescription>
              Crea un nuovo team per organizzare i partecipanti
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Nome team *</Label>
              <Input
                id="teamName"
                placeholder="Es. Investitori, Consulenti..."
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamRole">Ruolo predefinito</Label>
              <Select
                value={newTeam.role}
                onValueChange={(value) => setNewTeam({ ...newTeam, role: value })}
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
            <Button variant="outline" onClick={() => setCreateTeamOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateTeam} disabled={loading || !newTeam.name}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Settings Dialog */}
      <Dialog open={teamSettingsOpen} onOpenChange={setTeamSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impostazioni team</DialogTitle>
            <DialogDescription>
              Modifica le impostazioni del team {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome team</Label>
              <Input defaultValue={selectedTeam?.name} />
            </div>
            <div className="space-y-2">
              <Label>Ruolo predefinito</Label>
              <Select defaultValue={selectedTeam?.role}>
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
            <Button variant="outline" onClick={() => setTeamSettingsOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => setTeamSettingsOpen(false)}>
              Salva modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Team Dialog */}
      <Dialog open={moveToTeamOpen} onOpenChange={setMoveToTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sposta in team</DialogTitle>
            <DialogDescription>
              Seleziona il team di destinazione
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Team di destinazione</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveToTeamOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => setMoveToTeamOpen(false)}>
              Sposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
