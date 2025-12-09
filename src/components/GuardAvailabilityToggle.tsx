import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, UserX } from "lucide-react";

export function GuardAvailabilityToggle() {
  const { user } = useAuth();
  const toggleAvailability = useMutation(api.auth.toggleAvailability);
  const users = useQuery(api.auth.getUsers);

  if (!user || user.role !== "guard") {
    return null;
  }

  const currentUser = users?.find((u) => u._id === user._id);
  const isAvailable = currentUser?.available ?? true; // Default to available

  const handleToggle = async () => {
    try {
      await toggleAvailability({
        userId: user._id,
        available: !isAvailable,
      });
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      alert("Failed to update availability. Please try again.");
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAvailable ? (
              <UserCheck className="h-5 w-5 text-green-500" />
            ) : (
              <UserX className="h-5 w-5 text-orange-500" />
            )}
            <div>
              <Label className="text-base font-semibold">
                Status: {isAvailable ? "Available" : "Away"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isAvailable
                  ? "You can receive new alert assignments"
                  : "You won't receive new alert assignments"}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              isAvailable ? "bg-green-500" : "bg-orange-500"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isAvailable ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
