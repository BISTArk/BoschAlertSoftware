import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useAuth } from "@/contexts/AuthContext"
import { AlertActions } from "@/components/AlertActions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, RefreshCw, ChevronDown, Filter, X } from "lucide-react"
import { useState, useEffect } from "react"

interface AlertsTableProps {
  onAlertClick?: (alertId: Id<"alerts">) => void;
}

export function AlertsTable({ onAlertClick }: AlertsTableProps = {}) {
  const { user } = useAuth();
  const [paginationCursor, setPaginationCursor] = useState<string | undefined>(undefined)
  const [pageStack, setPageStack] = useState<(string | undefined)[]>([undefined])
  const [itemsPerPage, setItemsPerPage] = useState(50)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("")
  const [eventCodeFilter, setEventCodeFilter] = useState<string>("")
  const [debouncedEventCodeFilter, setDebouncedEventCodeFilter] = useState<string>("")
  const [accountFilter, setAccountFilter] = useState<string>("")
  const [debouncedAccountFilter, setDebouncedAccountFilter] = useState<string>("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPaginationCursor(undefined);
      setPageStack([undefined]);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce event code filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEventCodeFilter(eventCodeFilter);
      setPaginationCursor(undefined);
      setPageStack([undefined]);
    }, 300);

    return () => clearTimeout(timer);
  }, [eventCodeFilter]);

  // Debounce account filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAccountFilter(accountFilter);
      setPaginationCursor(undefined);
      setPageStack([undefined]);
    }, 300);

    return () => clearTimeout(timer);
  }, [accountFilter]);

  // Build filters based on user role and filter selections
  const filters: any = {};
  
  // Guards only see their assigned alerts
  if (user?.role === "guard") {
    filters.assignedTo = user._id;
  }
  
  // Apply additional filters
  if (statusFilter) filters.status = statusFilter;
  if (debouncedSearchQuery) filters.searchQuery = debouncedSearchQuery;
  if (debouncedEventCodeFilter) filters.eventCode = debouncedEventCodeFilter;
  if (debouncedAccountFilter) filters.accountNumber = debouncedAccountFilter;

  // Real-time query - automatically updates when new data arrives
  const alertsResult = useQuery(api.alerts.getAlerts, {
    paginationOpts: {
      numItems: itemsPerPage,
      cursor: paginationCursor,
    },
    filters,
  })

  const totalCount = useQuery(api.alerts.getAlertsCount)
  const filteredCount = useQuery(api.alerts.getFilteredAlertsCount, { filters })
  
  // Fetch all alerts for full export (with same filters)
  const allAlerts = useQuery(api.alerts.getAlerts, {
    paginationOpts: {
      numItems: 10000, // Large number to get all alerts
    },
    filters,
  })

  const exportToCSV = (exportAll: boolean = false) => {
    const dataToExport = exportAll ? allAlerts?.page : alertsResult?.page
    if (!dataToExport) return

    const headers = [
      "Received At",
      "Customer Account",
      "Event Qualifier",
      "Event Code",
      "Event Description",
      "Event Category",
      "Priority",
      "Zone ID",
      "Partition",
      "Raw Message",
    ]

    const rows = dataToExport.map((alert) => [
      new Date(alert.receivedAt).toLocaleString(),
      alert.customerAccount || alert.accountNumber || "",
      alert.eventQualifier || "",
      alert.contactIdEventCode || alert.eventCode || "",
      alert.eventDescription || "",
      alert.eventCategory || "",
      alert.priority || "",
      alert.zoneId || alert.zone || "",
      alert.partitionNumber || alert.partition || "",
      alert.rawMessage,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const filename = exportAll 
      ? `alerts-all-${new Date().toISOString()}.csv`
      : `alerts-page-${pageStack.length}-${new Date().toISOString()}.csv`
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleNextPage = () => {
    if (alertsResult?.continueCursor) {
      setPageStack([...pageStack, alertsResult.continueCursor])
      setPaginationCursor(alertsResult.continueCursor)
    }
  }

  const handlePrevPage = () => {
    if (pageStack.length > 1) {
      const newStack = pageStack.slice(0, -1)
      setPageStack(newStack)
      setPaginationCursor(newStack[newStack.length - 1])
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    // Reset pagination when changing items per page
    setPaginationCursor(undefined)
    setPageStack([undefined])
  }

  if (!alertsResult) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const clearFilters = () => {
    setStatusFilter("");
    setSearchQuery("");
    setEventCodeFilter("");
    setAccountFilter("");
    setPaginationCursor(undefined);
    setPageStack([undefined]);
  };

  const hasActiveFilters = statusFilter || debouncedSearchQuery || debouncedEventCodeFilter || debouncedAccountFilter;

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      {user?.role !== "guard" && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: string) => {
              setStatusFilter(value);
              setPaginationCursor(undefined);
              setPageStack([undefined]);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Event code..."
            value={eventCodeFilter}
            onChange={(e) => setEventCodeFilter(e.target.value)}
            className="w-[120px]"
          />

          <Input
            placeholder="Account #..."
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-[120px]"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <>
                Filtered: {filteredCount || 0} / Total: {totalCount || 0}
              </>
            ) : (
              <>Total Alerts: {totalCount || 0}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {itemsPerPage} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleItemsPerPageChange(10)}>
                  10 per page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleItemsPerPageChange(25)}>
                  25 per page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleItemsPerPageChange(50)}>
                  50 per page
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleItemsPerPageChange(100)}>
                  100 per page
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportToCSV(false)}>
              Export Current Page ({alertsResult?.page.length || 0} items)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToCSV(true)}>
              Export All {hasActiveFilters ? 'Filtered' : ''} Data ({hasActiveFilters ? (filteredCount || 0) : (totalCount || 0)} items)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Customer Account</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Zone ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Qualifier</TableHead>
              <TableHead>Raw Message</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertsResult.page.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No alerts yet. Waiting for SIA messages...
                </TableCell>
              </TableRow>
            ) : (
              alertsResult.page.map((alert) => {
                const getStatusBadge = (status?: string) => {
                  const colors = {
                    unassigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                    assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  };
                  const label = status || "unassigned";
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[label as keyof typeof colors]}`}>
                      {label}
                    </span>
                  );
                };

                const getPriorityBadge = (priority?: string) => {
                  const colors = {
                    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
                    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                  };
                  if (!priority) return "-";
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
                      {priority}
                    </span>
                  );
                };

                return (
                  <TableRow 
                    key={alert._id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => onAlertClick?.(alert._id)}
                  >
                    <TableCell className="font-medium">
                      {new Date(alert.receivedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>{getPriorityBadge(alert.priority)}</TableCell>
                    <TableCell>{alert.customerAccount || alert.accountNumber || "-"}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {alert.contactIdEventCode || alert.eventCode || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{alert.eventDescription || "-"}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {alert.zoneId || alert.zone || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{alert.eventCategory || "-"}</TableCell>
                    <TableCell>
                      {alert.eventQualifier === "E" ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          New
                        </span>
                      ) : alert.eventQualifier === "R" ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Restore
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate">
                      {alert.rawMessage}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertActions
                        alertId={alert._id}
                        currentStatus={alert.status}
                        assignedTo={alert.assignedTo}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {alertsResult.page.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {(() => {
              const count = hasActiveFilters ? (filteredCount || 0) : (totalCount || 0);
              const startItem = (pageStack.length - 1) * itemsPerPage + 1;
              const endItem = Math.min(pageStack.length * itemsPerPage, count);
              return (
                <>
                  Page {pageStack.length} {count && itemsPerPage ? `/ ${Math.ceil(count / itemsPerPage)}` : ''}
                  {count > 0 && ` • Showing ${startItem}-${endItem} of ${count}`}
                </>
              );
            })()}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePrevPage}
              disabled={pageStack.length === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={handleNextPage}
              disabled={!alertsResult.continueCursor}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
