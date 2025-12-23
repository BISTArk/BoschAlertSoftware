import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, UserPlus } from "lucide-react";

interface AlertActionsProps {
  alertId: Id<"alerts">;
  currentStatus?: string;
  assignedTo?: Id<"users">;
}

export function AlertActions({ alertId, currentStatus, assignedTo }: AlertActionsProps) {
  const { user } = useAuth();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<string>("");
  const [notes, setNotes] = useState("");

  const guards = useQuery(api.auth.getAvailableGuards);
  const assignAlert = useMutation(api.alerts.assignAlert);
  const reassignAlert = useMutation(api.alerts.reassignAlert);
  const updateStatus = useMutation(api.alerts.updateAlertStatus);

  const handleAssign = async () => {
    if (!selectedGuard || !user) return;

    try {
      if (assignedTo) {
        // Reassign
        await reassignAlert({
          alertId,
          newGuardId: selectedGuard as Id<"users">,
          reassignedBy: user._id,
        });
      } else {
        // Initial assignment
        await assignAlert({
          alertId,
          guardId: selectedGuard as Id<"users">,
          assignedBy: user._id,
        });
      }
      setShowAssignDialog(false);
      setSelectedGuard("");
    } catch (error) {
      console.error("Failed to assign alert:", error);
      alert(error instanceof Error ? error.message : "Failed to assign alert. Please try again.");
    }
  };

  const handleResolve = async () => {
    if (!user) return;

    try {
      await updateStatus({
        alertId,
        status: "resolved",
        userId: user._id,
        notes: notes || undefined,
      });
      setShowResolveDialog(false);
      setNotes("");
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;

    try {
      await updateStatus({
        alertId,
        status: newStatus as "unassigned" | "assigned" | "in-progress" | "resolved",
        userId: user._id,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const isGuard = user?.role === "guard";
  const isHeadOrAdmin = user?.role === "head" || user?.role === "admin";

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {/* Guards can mark as in-progress or resolved */}
      {isGuard && currentStatus !== "resolved" && (
        <>
          {currentStatus === "assigned" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange("in-progress");
              }}
            >
              Start
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowResolveDialog(true);
            }}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Resolve
          </Button>
        </>
      )}

      {/* Heads and Admins can assign/reassign */}
      {isHeadOrAdmin && currentStatus !== "resolved" && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowAssignDialog(true);
          }}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          {assignedTo ? "Reassign" : "Assign"}
        </Button>
      )}

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignedTo ? "Reassign Alert" : "Assign Alert"}</DialogTitle>
            <DialogDescription>
              Select a guard to {assignedTo ? "reassign" : "assign"} this alert to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guard">Guard</Label>
              <Select value={selectedGuard} onValueChange={setSelectedGuard}>
                <SelectTrigger id="guard">
                  <SelectValue placeholder="Select a guard" />
                </SelectTrigger>
                <SelectContent>
                  {guards?.map((guard) => (
                    <SelectItem key={guard._id} value={guard._id}>
                      {guard.name} (@{guard.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedGuard}>
              {assignedTo ? "Reassign" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Add any notes about the resolution (optional).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any notes about how this alert was resolved..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
