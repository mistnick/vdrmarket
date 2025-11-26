"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Search,
    Filter,
    Download,
    MessageSquare,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Question {
    id: string;
    questionText: string;
    status: string;
    priority: string;
    createdAt: string;
    askedBy: { id: string; name: string | null; email: string };
    category: { id: string; name: string; color: string | null } | null;
    answers: Answer[];
}

interface Answer {
    id: string;
    answerText: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string };
}

interface QAViewerProps {
    dataRoomId: string;
}

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "answered", label: "Answered" },
    { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

export function QAViewer({ dataRoomId }: QAViewerProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Create question dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        questionText: "",
        priority: "normal",
    });

    // Answer dialog
    const [answeringQuestion, setAnsweringQuestion] = useState<Question | null>(null);
    const [answerText, setAnswerText] = useState("");

    useEffect(() => {
        fetchQuestions();
    }, [dataRoomId, statusFilter, priorityFilter]);

    const fetchQuestions = async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (priorityFilter !== "all") params.set("priority", priorityFilter);

            const response = await fetch(
                `/api/datarooms/${dataRoomId}/questions?${params}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch questions");
            }

            setQuestions(data.questions || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(`/api/datarooms/${dataRoomId}/questions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newQuestion),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create question");
            }

            await fetchQuestions();
            setShowCreateDialog(false);
            setNewQuestion({ questionText: "", priority: "normal" });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitAnswer = async (questionId: string) => {
        if (!answerText.trim()) return;

        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(
                `/api/datarooms/${dataRoomId}/questions/${questionId}/answers`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answerText }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit answer");
            }

            await fetchQuestions();
            setAnsweringQuestion(null);
            setAnswerText("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = async (format: "excel" | "pdf") => {
        try {
            const response = await fetch(
                `/api/datarooms/${dataRoomId}/questions/export?format=${format}`
            );

            if (!response.ok) {
                throw new Error("Failed to export");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `qa-export-${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const filteredQuestions = questions.filter((q) =>
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
                return <Clock className="h-4 w-4" />;
            case "answered":
                return <CheckCircle2 className="h-4 w-4" />;
            case "closed":
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <MessageSquare className="h-4 w-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "destructive";
            case "high":
                return "default";
            case "normal":
                return "secondary";
            case "low":
                return "outline";
            default:
                return "secondary";
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Q&A Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage questions and answers for this data room
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport("excel")}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                    </Button>
                    <Button variant="outline" onClick={() => handleExport("pdf")}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ask Question
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Filters */}
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <Label>Search</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Questions List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredQuestions.length === 0 ? (
                <Card className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-medium mb-2">No questions yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start by asking a question
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ask First Question
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredQuestions.map((question) => (
                        <Card key={question.id} className="p-6">
                            <div className="space-y-4">
                                {/* Question Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant={getPriorityColor(question.priority)}>
                                                {question.priority}
                                            </Badge>
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                {getStatusIcon(question.status)}
                                                {question.status}
                                            </Badge>
                                            {question.category && (
                                                <Badge
                                                    variant="secondary"
                                                    style={{
                                                        backgroundColor: question.category.color ? `${question.category.color}20` : undefined,
                                                        color: question.category.color || undefined,
                                                    }}
                                                >
                                                    {question.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-lg font-medium">{question.questionText}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Asked by {question.askedBy.name || question.askedBy.email} •{" "}
                                            {formatDistanceToNow(new Date(question.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>

                                    {question.status === "pending" && (
                                        <Button
                                            size="sm"
                                            onClick={() => setAnsweringQuestion(question)}
                                        >
                                            Answer
                                        </Button>
                                    )}
                                </div>

                                {/* Answers */}
                                {question.answers.length > 0 && (
                                    <div className="space-y-3 mt-4 pt-4 border-t">
                                        {question.answers.map((answer) => (
                                            <div
                                                key={answer.id}
                                                className="bg-muted/50 rounded-lg p-4"
                                            >
                                                <p className="text-sm mb-2">{answer.answerText}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Answered by {answer.user.name || answer.user.email} •{" "}
                                                    {formatDistanceToNow(new Date(answer.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Question Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ask a Question</DialogTitle>
                        <DialogDescription>
                            Submit your question to the data room administrators
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateQuestion} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="questionText">Question *</Label>
                            <Textarea
                                id="questionText"
                                value={newQuestion.questionText}
                                onChange={(e) =>
                                    setNewQuestion({ ...newQuestion, questionText: e.target.value })
                                }
                                placeholder="What would you like to know?"
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={newQuestion.priority}
                                onValueChange={(value) =>
                                    setNewQuestion({ ...newQuestion, priority: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateDialog(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Question"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Answer Dialog */}
            <Dialog
                open={!!answeringQuestion}
                onOpenChange={() => setAnsweringQuestion(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Answer Question</DialogTitle>
                        <DialogDescription>
                            {answeringQuestion?.questionText}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="answerText">Your Answer *</Label>
                            <Textarea
                                id="answerText"
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="Provide a detailed answer..."
                                rows={6}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setAnsweringQuestion(null)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() =>
                                    answeringQuestion &&
                                    handleSubmitAnswer(answeringQuestion.id)
                                }
                                disabled={!answerText.trim() || submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Answer"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
