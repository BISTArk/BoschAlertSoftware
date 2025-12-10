/**
 * Test Alert Generator Component
 * 
 * This component allows admin users to generate test alerts in the new Contact ID format
 * for testing and demonstration purposes.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { parseContactIdMessage, generateAlertMessage } from "../lib/contactIdParser";

export function TestAlertGenerator() {
  const [customerAccount, setCustomerAccount] = useState("1234");
  const [eventQualifier, setEventQualifier] = useState<"E" | "R">("E");
  const [eventCode, setEventCode] = useState("301"); // AC Loss
  const [partition, setPartition] = useState("00");
  const [zoneId, setZoneId] = useState("001");
  const [assignedTo, setAssignedTo] = useState<string>("unassigned");

  const guards = useQuery(api.auth.getAvailableGuards);
  const createContactIdAlert = useMutation(api.alerts.createContactIdAlert);

  const handleGenerateAlert = async () => {
    // Construct the Contact ID message
    const message = `${customerAccount} ${eventQualifier} ${eventCode} ${partition} ${zoneId}`;
    
    // Parse it
    const parsed = parseContactIdMessage(message);
    
    if (!parsed) {
      alert("Invalid message format");
      return;
    }

    try {
      await createContactIdAlert({
        rawMessage: message,
        customerAccount: parsed.customerAccount,
        eventQualifier: parsed.eventQualifier,
        contactIdEventCode: parsed.contactIdEventCode,
        partitionNumber: parsed.partitionNumber,
        zoneId: parsed.zoneId,
        eventCategory: parsed.eventCategory,
        eventType: parsed.eventType,
        eventDescription: parsed.eventDescription,
        priority: parsed.priority,
        assignedTo: assignedTo !== "unassigned" ? (assignedTo as Id<"users">) : undefined,
      });
      
      alert(`Alert created: ${generateAlertMessage(parsed)}`);
    } catch (error) {
      alert(`Error creating alert: ${error}`);
    }
  };

  // Common event codes for quick selection
  const commonEvents = [
    { code: "301", name: "AC Loss" },
    { code: "302", name: "Low System Battery" },
    { code: "380", name: "Sensor Trouble" },
    { code: "381", name: "Loss of RF Supervision" },
    { code: "383", name: "Sensor Tamper" },
    { code: "384", name: "RF Sensor Low Battery" },
    { code: "401", name: "Open/Close by User" },
    { code: "421", name: "Access Denied" },
    { code: "422", name: "Access Granted" },
    { code: "423", name: "Forced Access (Panic)" },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Contact ID Test Alert Generator</CardTitle>
        <CardDescription>
          Generate test alerts in Contact ID format: [Customer Account] [Event Qualifier] [Event Code] [Partition] [Zone ID]
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerAccount">Customer Account</Label>
            <Input
              id="customerAccount"
              value={customerAccount}
              onChange={(e) => setCustomerAccount(e.target.value)}
              placeholder="1234"
            />
          </div>

          <div>
            <Label htmlFor="eventQualifier">Event Qualifier</Label>
            <Select value={eventQualifier} onValueChange={(v) => setEventQualifier(v as "E" | "R")}>
              <SelectTrigger id="eventQualifier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="E">E - New Event</SelectItem>
                <SelectItem value="R">R - Restore</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="eventCode">Event Code</Label>
            <Select value={eventCode} onValueChange={setEventCode}>
              <SelectTrigger id="eventCode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonEvents.map((event) => (
                  <SelectItem key={event.code} value={event.code}>
                    {event.code} - {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="partition">Partition (Hex)</Label>
            <Input
              id="partition"
              value={partition}
              onChange={(e) => setPartition(e.target.value.toUpperCase())}
              placeholder="00"
              maxLength={2}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="zoneId">Zone ID (000-999)</Label>
            <Input
              id="zoneId"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              placeholder="001"
              maxLength={3}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="assignedTo">Assign to Guard (Optional)</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {guards?.map((guard) => (
                  <SelectItem key={guard._id} value={guard._id}>
                    {guard.name} ({guard.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm font-medium mb-2">Preview Message:</p>
          <code className="text-sm">{customerAccount} {eventQualifier} {eventCode} {partition} {zoneId}</code>
        </div>

        <Button onClick={handleGenerateAlert} className="w-full">
          Generate Test Alert
        </Button>
      </CardContent>
    </Card>
  );
}
