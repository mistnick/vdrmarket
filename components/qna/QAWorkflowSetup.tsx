"use client";

import React, { useReducer, useCallback, useRef, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Settings2,
    Users,
    UserCheck,
    Eye,
    Save,
    RotateCcw,
    Loader2,
    Check,
    AlertCircle,
    ArrowRight,
    MessageSquare,
    Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES (as specified - DO NOT MODIFY base types)
// ============================================================================

type User = {
    id: string;
    name: string;
    email: string;
};

type TeamMember = {
    id: string;
    user: User;
    roleLabel?: string;
};

type GroupMember = {
    id: string;
    user: User;
    groupName: string;
};

type DataRoom = {
    id: string;
    name: string;
    teamMembers: TeamMember[];
    groupMembers: GroupMember[];
};

// ============================================================================
// Q&A WORKFLOW CONFIG TYPES (new types for configuration)
// ============================================================================

export type QARole =
    | "QUESTION_DRAFTER"
    | "QUESTION_SUBMITTER"
    | "ANSWER_COORDINATOR"
    | "EXPERT"
    | "ANSWER_APPROVER";

export const QUESTION_SIDE_ROLES: QARole[] = ["QUESTION_DRAFTER", "QUESTION_SUBMITTER"];
export const ANSWER_SIDE_ROLES: QARole[] = ["ANSWER_COORDINATOR", "EXPERT", "ANSWER_APPROVER"];

export type RoleInfo = {
    role: QARole;
    label: string;
    description: string;
    side: "question" | "answer";
};

export const ROLE_DEFINITIONS: RoleInfo[] = [
    {
        role: "QUESTION_DRAFTER",
        label: "Question drafter",
        description: "Can draft questions but needs approval before submission",
        side: "question",
    },
    {
        role: "QUESTION_SUBMITTER",
        label: "Question submitter",
        description: "Can submit questions directly to the internal team",
        side: "question",
    },
    {
        role: "ANSWER_COORDINATOR",
        label: "Answer coordinator",
        description: "Receives questions and coordinates the answer process",
        side: "answer",
    },
    {
        role: "EXPERT",
        label: "Expert",
        description: "Subject matter expert who provides answers",
        side: "answer",
    },
    {
        role: "ANSWER_APPROVER",
        label: "Answer approver",
        description: "Reviews and approves answers before they are sent",
        side: "answer",
    },
];

export type QAWorkflowConfig = {
    dataRoomId: string;
    enabledRoles: Set<QARole>;
    questionSide: Record<string, QARole[]>; // groupMemberId → roles
    answerSide: Record<string, QARole[]>; // teamMemberId → roles
};

export type QAWorkflowSetupProps = {
    dataRoom: DataRoom;
    initialConfig?: QAWorkflowConfig;
    onChange?(config: QAWorkflowConfig): void;
    onSave?(config: QAWorkflowConfig): Promise<void> | void;
};

// ============================================================================
// REDUCER
// ============================================================================

type ConfigAction =
    | { type: "TOGGLE_ROLE"; role: QARole }
    | { type: "SET_QUESTION_ROLE"; groupMemberId: string; role: QARole; enabled: boolean }
    | { type: "SET_ANSWER_ROLE"; teamMemberId: string; role: QARole; enabled: boolean }
    | { type: "RESET"; config: QAWorkflowConfig };

function configReducer(state: QAWorkflowConfig, action: ConfigAction): QAWorkflowConfig {
    switch (action.type) {
        case "TOGGLE_ROLE": {
            const newEnabledRoles = new Set(state.enabledRoles);
            if (newEnabledRoles.has(action.role)) {
                newEnabledRoles.delete(action.role);
                // Remove this role from all assignments
                const isQuestionRole = QUESTION_SIDE_ROLES.includes(action.role);
                if (isQuestionRole) {
                    const newQuestionSide = { ...state.questionSide };
                    for (const memberId of Object.keys(newQuestionSide)) {
                        newQuestionSide[memberId] = newQuestionSide[memberId].filter(
                            (r) => r !== action.role
                        );
                        if (newQuestionSide[memberId].length === 0) {
                            delete newQuestionSide[memberId];
                        }
                    }
                    return { ...state, enabledRoles: newEnabledRoles, questionSide: newQuestionSide };
                } else {
                    const newAnswerSide = { ...state.answerSide };
                    for (const memberId of Object.keys(newAnswerSide)) {
                        newAnswerSide[memberId] = newAnswerSide[memberId].filter(
                            (r) => r !== action.role
                        );
                        if (newAnswerSide[memberId].length === 0) {
                            delete newAnswerSide[memberId];
                        }
                    }
                    return { ...state, enabledRoles: newEnabledRoles, answerSide: newAnswerSide };
                }
            } else {
                newEnabledRoles.add(action.role);
            }
            return { ...state, enabledRoles: newEnabledRoles };
        }

        case "SET_QUESTION_ROLE": {
            const newQuestionSide = { ...state.questionSide };
            const currentRoles = newQuestionSide[action.groupMemberId] || [];
            if (action.enabled) {
                if (!currentRoles.includes(action.role)) {
                    newQuestionSide[action.groupMemberId] = [...currentRoles, action.role];
                }
            } else {
                newQuestionSide[action.groupMemberId] = currentRoles.filter(
                    (r) => r !== action.role
                );
                if (newQuestionSide[action.groupMemberId].length === 0) {
                    delete newQuestionSide[action.groupMemberId];
                }
            }
            return { ...state, questionSide: newQuestionSide };
        }

        case "SET_ANSWER_ROLE": {
            const newAnswerSide = { ...state.answerSide };
            const currentRoles = newAnswerSide[action.teamMemberId] || [];
            if (action.enabled) {
                if (!currentRoles.includes(action.role)) {
                    newAnswerSide[action.teamMemberId] = [...currentRoles, action.role];
                }
            } else {
                newAnswerSide[action.teamMemberId] = currentRoles.filter(
                    (r) => r !== action.role
                );
                if (newAnswerSide[action.teamMemberId].length === 0) {
                    delete newAnswerSide[action.teamMemberId];
                }
            }
            return { ...state, answerSide: newAnswerSide };
        }

        case "RESET":
            return action.config;

        default:
            return state;
    }
}

function createDefaultConfig(dataRoomId: string): QAWorkflowConfig {
    return {
        dataRoomId,
        enabledRoles: new Set(),
        questionSide: {},
        answerSide: {},
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function groupMembersByGroupName(members: GroupMember[]): Record<string, GroupMember[]> {
    return members.reduce((acc, member) => {
        if (!acc[member.groupName]) {
            acc[member.groupName] = [];
        }
        acc[member.groupName].push(member);
        return acc;
    }, {} as Record<string, GroupMember[]>);
}

function getRoleLabelByRole(role: QARole): string {
    return ROLE_DEFINITIONS.find((r) => r.role === role)?.label || role;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Section A: Role Configuration
function RoleConfigSection({
    enabledRoles,
    onToggleRole,
}: {
    enabledRoles: Set<QARole>;
    onToggleRole: (role: QARole) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-emerald-600" />
                    <CardTitle>Roles available in this DataRoom</CardTitle>
                </div>
                <CardDescription>
                    Toggle roles on/off to enable or disable them in the Q&A workflow
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {ROLE_DEFINITIONS.map((roleInfo) => (
                        <div
                            key={roleInfo.role}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                                enabledRoles.has(roleInfo.role)
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-slate-50 border-slate-200"
                            )}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">
                                        {roleInfo.label}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            roleInfo.side === "question"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-purple-100 text-purple-700"
                                        )}
                                    >
                                        {roleInfo.side === "question" ? "Question side" : "Answer side"}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{roleInfo.description}</p>
                            </div>
                            <Switch
                                checked={enabledRoles.has(roleInfo.role)}
                                onCheckedChange={() => onToggleRole(roleInfo.role)}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Section B: Team Assignment
function TeamAssignmentSection({
    dataRoom,
    config,
    onSetQuestionRole,
    onSetAnswerRole,
    highlightedMemberId,
}: {
    dataRoom: DataRoom;
    config: QAWorkflowConfig;
    onSetQuestionRole: (groupMemberId: string, role: QARole, enabled: boolean) => void;
    onSetAnswerRole: (teamMemberId: string, role: QARole, enabled: boolean) => void;
    highlightedMemberId: string | null;
}) {
    const groupedMembers = groupMembersByGroupName(dataRoom.groupMembers);
    const enabledQuestionRoles = QUESTION_SIDE_ROLES.filter((r) => config.enabledRoles.has(r));
    const enabledAnswerRoles = ANSWER_SIDE_ROLES.filter((r) => config.enabledRoles.has(r));

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle>Teams and Role Assignment</CardTitle>
                </div>
                <CardDescription>
                    Assign enabled roles to team members and group members
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Question Side (Left) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <h3 className="font-semibold text-slate-900">
                                Question side (buyers / groups)
                            </h3>
                        </div>

                        {enabledQuestionRoles.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg">
                                Enable at least one question-side role in the section above to start
                                assigning it
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(groupedMembers).map(([groupName, members]) => (
                                    <div key={groupName} className="space-y-2">
                                        <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded">
                                            [{groupName}]
                                        </div>
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                id={`member-${member.id}`}
                                                className={cn(
                                                    "p-3 rounded-lg border transition-all",
                                                    highlightedMemberId === member.id
                                                        ? "bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200"
                                                        : "bg-white border-slate-200"
                                                )}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {member.user.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {member.user.email}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        {enabledQuestionRoles.map((role) => {
                                                            const isChecked =
                                                                config.questionSide[member.id]?.includes(role) ||
                                                                false;
                                                            return (
                                                                <div
                                                                    key={role}
                                                                    className="flex items-center gap-1.5"
                                                                >
                                                                    <Checkbox
                                                                        id={`${member.id}-${role}`}
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) =>
                                                                            onSetQuestionRole(
                                                                                member.id,
                                                                                role,
                                                                                !!checked
                                                                            )
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`${member.id}-${role}`}
                                                                        className="text-xs cursor-pointer"
                                                                    >
                                                                        {getRoleLabelByRole(role)}
                                                                    </Label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Answer Side (Right) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <h3 className="font-semibold text-slate-900">
                                Answer side (internal team)
                            </h3>
                        </div>

                        {enabledAnswerRoles.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg">
                                Enable at least one answer-side role in the section above to start
                                assigning it
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {dataRoom.teamMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        id={`member-${member.id}`}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all",
                                            highlightedMemberId === member.id
                                                ? "bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200"
                                                : "bg-white border-slate-200"
                                        )}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-slate-900">
                                                        {member.user.name}
                                                    </p>
                                                    {member.roleLabel && (
                                                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                            {member.roleLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {member.user.email}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {enabledAnswerRoles.map((role) => {
                                                    const isChecked =
                                                        config.answerSide[member.id]?.includes(role) || false;
                                                    return (
                                                        <div
                                                            key={role}
                                                            className="flex items-center gap-1.5"
                                                        >
                                                            <Checkbox
                                                                id={`${member.id}-${role}`}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) =>
                                                                    onSetAnswerRole(member.id, role, !!checked)
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`${member.id}-${role}`}
                                                                className="text-xs cursor-pointer"
                                                            >
                                                                {getRoleLabelByRole(role)}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Section C: Workflow Preview
function WorkflowPreviewSection({
    dataRoom,
    config,
    onMemberClick,
}: {
    dataRoom: DataRoom;
    config: QAWorkflowConfig;
    onMemberClick: (memberId: string) => void;
}) {
    const groupedMembers = groupMembersByGroupName(dataRoom.groupMembers);

    // Build data for each lane
    const questionGroups: { groupName: string; members: { id: string; name: string; roles: QARole[] }[] }[] = [];
    for (const [groupName, members] of Object.entries(groupedMembers)) {
        const groupData: { id: string; name: string; roles: QARole[] }[] = [];
        for (const member of members) {
            const roles = (config.questionSide[member.id] || []).filter((r) =>
                config.enabledRoles.has(r)
            );
            if (roles.length > 0) {
                groupData.push({ id: member.id, name: member.user.name, roles });
            }
        }
        if (groupData.length > 0) {
            questionGroups.push({ groupName, members: groupData });
        }
    }

    const coordinators: { id: string; name: string }[] = [];
    const experts: { id: string; name: string }[] = [];
    const approvers: { id: string; name: string }[] = [];

    for (const member of dataRoom.teamMembers) {
        const roles = config.answerSide[member.id] || [];
        if (roles.includes("ANSWER_COORDINATOR") && config.enabledRoles.has("ANSWER_COORDINATOR")) {
            coordinators.push({ id: member.id, name: member.user.name });
        }
        if (roles.includes("EXPERT") && config.enabledRoles.has("EXPERT")) {
            experts.push({ id: member.id, name: member.user.name });
        }
        if (roles.includes("ANSWER_APPROVER") && config.enabledRoles.has("ANSWER_APPROVER")) {
            approvers.push({ id: member.id, name: member.user.name });
        }
    }

    const hasQuestionSide = questionGroups.length > 0;
    const hasCoordinators = coordinators.length > 0;
    const hasExpertsOrApprovers = experts.length > 0 || approvers.length > 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-amber-600" />
                    <CardTitle>Workflow Preview</CardTitle>
                </div>
                <CardDescription>
                    Visual representation of the Q&A workflow. Click on a person to highlight their
                    row above.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative overflow-x-auto">
                    <div className="flex gap-4 min-w-[700px]">
                        {/* Lane 1: Question Side */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="text-center mb-3">
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Question side
                                </span>
                            </div>
                            <div className="space-y-3">
                                {questionGroups.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                                        No question roles assigned
                                    </div>
                                ) : (
                                    questionGroups.map((group) => (
                                        <div
                                            key={group.groupName}
                                            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                                        >
                                            <div className="text-xs font-semibold text-blue-700 mb-2">
                                                {group.groupName}
                                            </div>
                                            <div className="space-y-1.5">
                                                {group.members.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => onMemberClick(m.id)}
                                                        className="w-full text-left px-2 py-1.5 bg-white rounded border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                                                    >
                                                        <div className="font-medium text-slate-800">
                                                            {m.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {m.roles.map(getRoleLabelByRole).join(", ")}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Arrow 1 */}
                        <div className="flex items-center justify-center w-12">
                            {(hasQuestionSide || hasCoordinators) && (
                                <ArrowRight className="h-6 w-6 text-slate-400" />
                            )}
                        </div>

                        {/* Lane 2: Answer Coordination */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="text-center mb-3">
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                                    <UserCheck className="h-3.5 w-3.5" />
                                    Answer coordination
                                </span>
                            </div>
                            <div className="space-y-3">
                                {!config.enabledRoles.has("ANSWER_COORDINATOR") ? (
                                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                                        Coordinator role not enabled
                                    </div>
                                ) : coordinators.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                                        No coordinator assigned
                                    </div>
                                ) : (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-purple-700 mb-2">
                                            Coordinators
                                        </div>
                                        <div className="space-y-1.5">
                                            {coordinators.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => onMemberClick(c.id)}
                                                    className="w-full text-left px-2 py-1.5 bg-white rounded border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm font-medium text-slate-800"
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Arrow 2 */}
                        <div className="flex items-center justify-center w-12">
                            {(hasCoordinators || hasExpertsOrApprovers) && (
                                <ArrowRight className="h-6 w-6 text-slate-400" />
                            )}
                        </div>

                        {/* Lane 3: Experts & Approvers */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="text-center mb-3">
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                                    <Shield className="h-3.5 w-3.5" />
                                    Experts & Approvers
                                </span>
                            </div>
                            <div className="space-y-3">
                                {/* Experts */}
                                {config.enabledRoles.has("EXPERT") && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-amber-700 mb-2">
                                            Experts
                                        </div>
                                        {experts.length === 0 ? (
                                            <div className="text-xs text-slate-400 text-center py-2">
                                                No experts assigned
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {experts.map((e) => (
                                                    <button
                                                        key={e.id}
                                                        onClick={() => onMemberClick(e.id)}
                                                        className="w-full text-left px-2 py-1.5 bg-white rounded border border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition-colors text-sm font-medium text-slate-800"
                                                    >
                                                        {e.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Approvers */}
                                {config.enabledRoles.has("ANSWER_APPROVER") && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-green-700 mb-2">
                                            Approvers
                                        </div>
                                        {approvers.length === 0 ? (
                                            <div className="text-xs text-slate-400 text-center py-2">
                                                No approvers assigned
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {approvers.map((a) => (
                                                    <button
                                                        key={a.id}
                                                        onClick={() => onMemberClick(a.id)}
                                                        className="w-full text-left px-2 py-1.5 bg-white rounded border border-green-100 hover:border-green-300 hover:bg-green-50 transition-colors text-sm font-medium text-slate-800"
                                                    >
                                                        {a.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!config.enabledRoles.has("EXPERT") &&
                                    !config.enabledRoles.has("ANSWER_APPROVER") && (
                                        <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                                            Expert/Approver roles not enabled
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QAWorkflowSetup({
    dataRoom,
    initialConfig,
    onChange,
    onSave,
}: QAWorkflowSetupProps) {
    const [config, dispatch] = useReducer(
        configReducer,
        initialConfig || createDefaultConfig(dataRoom.id)
    );

    const [saveState, setSaveState] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);
    const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Serialize config for onChange callback (convert Set to array for external use)
    const serializeConfig = useCallback((cfg: QAWorkflowConfig): QAWorkflowConfig => {
        return {
            ...cfg,
            enabledRoles: new Set(cfg.enabledRoles),
        };
    }, []);

    const handleToggleRole = useCallback(
        (role: QARole) => {
            dispatch({ type: "TOGGLE_ROLE", role });
            // Trigger onChange after state update
            setTimeout(() => {
                const newConfig = configReducer(config, { type: "TOGGLE_ROLE", role });
                onChange?.(serializeConfig(newConfig));
            }, 0);
        },
        [config, onChange, serializeConfig]
    );

    const handleSetQuestionRole = useCallback(
        (groupMemberId: string, role: QARole, enabled: boolean) => {
            dispatch({ type: "SET_QUESTION_ROLE", groupMemberId, role, enabled });
            setTimeout(() => {
                const newConfig = configReducer(config, {
                    type: "SET_QUESTION_ROLE",
                    groupMemberId,
                    role,
                    enabled,
                });
                onChange?.(serializeConfig(newConfig));
            }, 0);
        },
        [config, onChange, serializeConfig]
    );

    const handleSetAnswerRole = useCallback(
        (teamMemberId: string, role: QARole, enabled: boolean) => {
            dispatch({ type: "SET_ANSWER_ROLE", teamMemberId, role, enabled });
            setTimeout(() => {
                const newConfig = configReducer(config, {
                    type: "SET_ANSWER_ROLE",
                    teamMemberId,
                    role,
                    enabled,
                });
                onChange?.(serializeConfig(newConfig));
            }, 0);
        },
        [config, onChange, serializeConfig]
    );

    const handleReset = useCallback(() => {
        const resetConfig = initialConfig || createDefaultConfig(dataRoom.id);
        dispatch({ type: "RESET", config: resetConfig });
        onChange?.(serializeConfig(resetConfig));
        setSaveState("idle");
    }, [dataRoom.id, initialConfig, onChange, serializeConfig]);

    const handleSave = useCallback(async () => {
        if (!onSave) return;

        setSaveState("loading");
        try {
            await onSave(serializeConfig(config));
            setSaveState("success");
            setTimeout(() => setSaveState("idle"), 3000);
        } catch {
            setSaveState("error");
            setTimeout(() => setSaveState("idle"), 3000);
        }
    }, [config, onSave, serializeConfig]);

    const handleMemberClick = useCallback((memberId: string) => {
        // Clear any existing timeout
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }

        setHighlightedMemberId(memberId);

        // Scroll to the element
        const element = document.getElementById(`member-${memberId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Remove highlight after 2 seconds
        highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedMemberId(null);
        }, 2000);
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Q&A Workflow Setup</h1>
                <p className="text-slate-600 mt-1">
                    Configure the Q&A workflow for <span className="font-medium">{dataRoom.name}</span>
                </p>
            </div>

            {/* Section A: Role Configuration */}
            <RoleConfigSection
                enabledRoles={config.enabledRoles}
                onToggleRole={handleToggleRole}
            />

            {/* Section B: Team Assignment */}
            <TeamAssignmentSection
                dataRoom={dataRoom}
                config={config}
                onSetQuestionRole={handleSetQuestionRole}
                onSetAnswerRole={handleSetAnswerRole}
                highlightedMemberId={highlightedMemberId}
            />

            {/* Section C: Workflow Preview */}
            <WorkflowPreviewSection
                dataRoom={dataRoom}
                config={config}
                onMemberClick={handleMemberClick}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to initial config
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saveState === "loading" || !onSave}
                    className="min-w-[140px]"
                >
                    {saveState === "loading" && (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    )}
                    {saveState === "success" && (
                        <>
                            <Check className="h-4 w-4 mr-2" />
                            Saved!
                        </>
                    )}
                    {saveState === "error" && (
                        <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Error
                        </>
                    )}
                    {saveState === "idle" && (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save workflow
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// MOCK DATA & DEMO EXPORT
// ============================================================================

const MOCK_DATA_ROOM: DataRoom = {
    id: "dr-001",
    name: "Acme Corp M&A Project",
    teamMembers: [
        {
            id: "tm-001",
            user: { id: "u-001", name: "Alice Johnson", email: "alice@acme.com" },
            roleLabel: "Project Lead",
        },
        {
            id: "tm-002",
            user: { id: "u-002", name: "Bob Smith", email: "bob@acme.com" },
            roleLabel: "Legal Counsel",
        },
        {
            id: "tm-003",
            user: { id: "u-003", name: "Carol White", email: "carol@acme.com" },
            roleLabel: "Finance Director",
        },
        {
            id: "tm-004",
            user: { id: "u-004", name: "David Brown", email: "david@acme.com" },
        },
    ],
    groupMembers: [
        {
            id: "gm-001",
            user: { id: "u-101", name: "Mario Rossi", email: "mario@buyerA.com" },
            groupName: "Buyer Group A",
        },
        {
            id: "gm-002",
            user: { id: "u-102", name: "John Doe", email: "john@buyerA.com" },
            groupName: "Buyer Group A",
        },
        {
            id: "gm-003",
            user: { id: "u-103", name: "Jane Smith", email: "jane@buyerA.com" },
            groupName: "Buyer Group A",
        },
        {
            id: "gm-004",
            user: { id: "u-201", name: "Hans Mueller", email: "hans@buyerB.de" },
            groupName: "Buyer Group B",
        },
        {
            id: "gm-005",
            user: { id: "u-202", name: "Greta Schmidt", email: "greta@buyerB.de" },
            groupName: "Buyer Group B",
        },
        {
            id: "gm-006",
            user: { id: "u-301", name: "Pierre Dupont", email: "pierre@buyerC.fr" },
            groupName: "Buyer Group C",
        },
    ],
};

export function QAWorkflowSetupDemo() {
    const handleChange = (config: QAWorkflowConfig) => {
        console.log("Config changed:", {
            ...config,
            enabledRoles: Array.from(config.enabledRoles),
        });
    };

    const handleSave = async (config: QAWorkflowConfig) => {
        console.log("Saving config:", {
            ...config,
            enabledRoles: Array.from(config.enabledRoles),
        });
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Config saved successfully!");
    };

    return (
        <QAWorkflowSetup
            dataRoom={MOCK_DATA_ROOM}
            onChange={handleChange}
            onSave={handleSave}
        />
    );
}

export default QAWorkflowSetup;
