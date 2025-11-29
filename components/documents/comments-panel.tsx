"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    Send,
    Loader2,
    Reply,
    Lock,
    Globe,
    AtSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
    id: string;
    content: string;
    isPrivate: boolean;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
    replies: Comment[];
}

interface CommentsPanelProps {
    documentId: string;
}

export function CommentsPanel({ documentId }: CommentsPanelProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [documentId]);

    const fetchComments = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/documents/${documentId}/comments`, {
                credentials: "include"
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch comments");
            }

            setComments(data.comments || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(`/api/documents/${documentId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    content: newComment,
                    parentId: replyingTo,
                    isPrivate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to post comment");
            }

            await fetchComments();
            setNewComment("");
            setReplyingTo(null);
            setIsPrivate(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return email[0].toUpperCase();
    };

    const renderComment = (comment: Comment, depth: number = 0) => (
        <div key={comment.id} className="space-y-3">
            <div
                className="flex gap-3"
                style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : 0 }}
            >
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                        {getInitials(comment.user.name, comment.user.email)}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                            {comment.user.name || comment.user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                            })}
                        </span>
                        {comment.isPrivate && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Private
                            </Badge>
                        )}
                    </div>

                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setReplyingTo(comment.id)}
                    >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                    </Button>
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-3">
                    {comment.replies.map((reply) => renderComment(reply, depth + 1))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="font-semibold">
                        Comments {comments.length > 0 && `(${comments.length})`}
                    </h3>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* New Comment Form */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                {replyingTo && (
                    <div className="flex items-center gap-2 text-sm">
                        <Reply className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Replying to comment</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => setReplyingTo(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                <Textarea
                    placeholder="Add a comment... Use @ to mention someone"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={isPrivate ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setIsPrivate(!isPrivate)}
                            className="h-8"
                        >
                            {isPrivate ? (
                                <>
                                    <Lock className="h-3 w-3 mr-2" />
                                    Private
                                </>
                            ) : (
                                <>
                                    <Globe className="h-3 w-3 mr-2" />
                                    Public
                                </>
                            )}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            <AtSign className="h-3 w-3 inline mr-1" />
                            Use @ to mention team members
                        </span>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || submitting}
                        size="sm"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Post
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-medium mb-2">No comments yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Start the discussion by adding a comment
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {comments.map((comment) => renderComment(comment))}
                </div>
            )}
        </div>
    );
}
