"use client";

import { useEffect, useCallback, useState, useRef } from "react";

export interface SecurityProtectionOptions {
  /** Block print functionality (Ctrl+P / Cmd+P) */
  blockPrint?: boolean;
  /** Block screenshot shortcuts (Cmd+Shift+3/4 on macOS) */
  blockScreenshotShortcuts?: boolean;
  /** Show overlay when window loses focus */
  blurOnFocusLoss?: boolean;
  /** Block copy (Ctrl+C / Cmd+C) */
  blockCopy?: boolean;
  /** Block save (Ctrl+S / Cmd+S) */
  blockSave?: boolean;
  /** Block right-click context menu */
  blockContextMenu?: boolean;
  /** Block text selection */
  blockSelection?: boolean;
  /** Block drag operations */
  blockDrag?: boolean;
  /** Detect DevTools opening (basic detection) */
  detectDevTools?: boolean;
  /** Callback when security violation is detected */
  onSecurityViolation?: (type: SecurityViolationType) => void;
}

export type SecurityViolationType =
  | "print_attempt"
  | "screenshot_attempt"
  | "copy_attempt"
  | "save_attempt"
  | "context_menu"
  | "focus_loss"
  | "devtools_open"
  | "visibility_hidden";

export interface SecurityProtectionState {
  isOverlayVisible: boolean;
  isDevToolsOpen: boolean;
  lastViolation: SecurityViolationType | null;
  violationCount: number;
}

/**
 * Hook for comprehensive document security protection
 * Implements multiple layers of protection against unauthorized capture/copying
 */
export function useSecurityProtection(
  options: SecurityProtectionOptions = {}
): SecurityProtectionState {
  const {
    blockPrint = true,
    blockScreenshotShortcuts = true,
    blurOnFocusLoss = true,
    blockCopy = true,
    blockSave = true,
    blockContextMenu = true,
    blockSelection = true,
    blockDrag = true,
    detectDevTools = true,
    onSecurityViolation,
  } = options;

  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [lastViolation, setLastViolation] = useState<SecurityViolationType | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleViolation = useCallback(
    (type: SecurityViolationType) => {
      setLastViolation(type);
      setViolationCount((prev) => prev + 1);
      onSecurityViolation?.(type);
    },
    [onSecurityViolation]
  );

  const showTemporaryOverlay = useCallback((duration: number = 2000) => {
    setIsOverlayVisible(true);
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
    }
    overlayTimeoutRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
    }, duration);
  }, []);

  useEffect(() => {
    // Keyboard shortcuts handler
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Block Print (Ctrl/Cmd + P)
      if (blockPrint && isMeta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("print_attempt");
        showTemporaryOverlay(3000);
        return false;
      }

      // Block Save (Ctrl/Cmd + S)
      if (blockSave && isMeta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("save_attempt");
        return false;
      }

      // Block Copy (Ctrl/Cmd + C)
      if (blockCopy && isMeta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("copy_attempt");
        return false;
      }

      // Block Screenshot shortcuts (macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (
        blockScreenshotShortcuts &&
        e.metaKey &&
        e.shiftKey &&
        ["3", "4", "5", "s", "S"].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("screenshot_attempt");
        showTemporaryOverlay(3000);
        return false;
      }

      // Block Windows screenshot (Windows + Shift + S)
      if (blockScreenshotShortcuts && e.shiftKey && e.key === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("screenshot_attempt");
        showTemporaryOverlay(3000);
        return false;
      }
    };

    // Context menu handler
    const handleContextMenu = (e: MouseEvent) => {
      if (blockContextMenu) {
        e.preventDefault();
        handleViolation("context_menu");
        return false;
      }
    };

    // Selection handler
    const handleSelectStart = (e: Event) => {
      if (blockSelection) {
        e.preventDefault();
        return false;
      }
    };

    // Drag handler
    const handleDragStart = (e: DragEvent) => {
      if (blockDrag) {
        e.preventDefault();
        return false;
      }
    };

    // Copy handler
    const handleCopy = (e: ClipboardEvent) => {
      if (blockCopy) {
        e.preventDefault();
        handleViolation("copy_attempt");
        return false;
      }
    };

    // Print handler via beforeprint event
    const handleBeforePrint = () => {
      if (blockPrint) {
        handleViolation("print_attempt");
        // We can't fully prevent print from this event, but we can log it
        // The CSS @media print { body { display: none; } } handles hiding
      }
    };

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (blurOnFocusLoss && document.hidden) {
        setIsOverlayVisible(true);
        handleViolation("visibility_hidden");
      } else {
        // Delay hiding overlay to prevent flash when switching tabs quickly
        setTimeout(() => {
          if (!document.hidden) {
            setIsOverlayVisible(false);
          }
        }, 100);
      }
    };

    // Window blur/focus handlers
    const handleBlur = () => {
      if (blurOnFocusLoss) {
        setIsOverlayVisible(true);
        handleViolation("focus_loss");
      }
    };

    const handleFocus = () => {
      if (blurOnFocusLoss) {
        setTimeout(() => {
          setIsOverlayVisible(false);
        }, 100);
      }
    };

    // DevTools detection (basic - can be bypassed but adds a layer)
    let devToolsCheckInterval: NodeJS.Timeout | null = null;
    if (detectDevTools) {
      const threshold = 160;
      devToolsCheckInterval = setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const isOpen = widthThreshold || heightThreshold;

        if (isOpen !== isDevToolsOpen) {
          setIsDevToolsOpen(isOpen);
          if (isOpen) {
            handleViolation("devtools_open");
            setIsOverlayVisible(true);
          }
        }
      }, 1000);
    }

    // Inject print-blocking CSS
    let printBlockStyle: HTMLStyleElement | null = null;
    if (blockPrint) {
      printBlockStyle = document.createElement("style");
      printBlockStyle.id = "security-print-block";
      printBlockStyle.innerHTML = `
        @media print {
          body, html {
            display: none !important;
            visibility: hidden !important;
          }
          * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `;
      document.head.appendChild(printBlockStyle);
    }

    // Inject selection-blocking CSS
    let selectionBlockStyle: HTMLStyleElement | null = null;
    if (blockSelection) {
      selectionBlockStyle = document.createElement("style");
      selectionBlockStyle.id = "security-selection-block";
      selectionBlockStyle.innerHTML = `
        .secure-viewer-container {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        .secure-viewer-container * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
      `;
      document.head.appendChild(selectionBlockStyle);
    }

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("selectstart", handleSelectStart, { capture: true });
    document.addEventListener("dragstart", handleDragStart, { capture: true });
    document.addEventListener("copy", handleCopy, { capture: true });
    window.addEventListener("beforeprint", handleBeforePrint);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      document.removeEventListener("selectstart", handleSelectStart, { capture: true });
      document.removeEventListener("dragstart", handleDragStart, { capture: true });
      document.removeEventListener("copy", handleCopy, { capture: true });
      window.removeEventListener("beforeprint", handleBeforePrint);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);

      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }

      if (devToolsCheckInterval) {
        clearInterval(devToolsCheckInterval);
      }

      if (printBlockStyle) {
        printBlockStyle.remove();
      }

      if (selectionBlockStyle) {
        selectionBlockStyle.remove();
      }
    };
  }, [
    blockPrint,
    blockScreenshotShortcuts,
    blurOnFocusLoss,
    blockCopy,
    blockSave,
    blockContextMenu,
    blockSelection,
    blockDrag,
    detectDevTools,
    isDevToolsOpen,
    handleViolation,
    showTemporaryOverlay,
  ]);

  return {
    isOverlayVisible,
    isDevToolsOpen,
    lastViolation,
    violationCount,
  };
}
