"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ClipboardList, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mettingAppAPI } from "@/lib/mettingAppApi";
import { toast } from "sonner";

function UseAiBot() {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [meetingData, setMeetingData] = useState<any>(null);
  const [actionItemsData, setActionItemsData] = useState<any[]>([]);
  console.log(actionItemsData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter meeting text");
      return;
    }

    setIsLoading(true);
    setError("");
    setMeetingData(null);
    setActionItemsData([]);

    try {
      const response = await fetch("http://10.10.253.3:5678/webhook/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) throw new Error("Failed to parse meeting");

      const data = await response.json();
      const processedData = Array.isArray(data) ? data[0] : data;

      // Separate action items from meeting data
      const { actionItems, ...rest } = processedData;
      setMeetingData(rest);
      setActionItemsData(actionItems || []);
    } catch (err) {
      console.error(err);
      setError("Failed to process meeting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setMeetingData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleActionItemChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    setActionItemsData((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const addActionItem = () => {
    setActionItemsData((prev) => [
      ...prev,
      {
        desc: "",
        penalty: "N/A",
        owner: "",
        due: new Date().toISOString().split("T")[0],
        status: "pending",
      },
    ]);
  };

  const removeActionItem = (index: number) => {
    setActionItemsData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    if (!meetingData) {
      setError("No data to submit.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Combine meeting data with action items
      const completeMeetingData = {
        ...meetingData,
        actionItems: actionItemsData,
      };
      console.log(meetingData, actionItemsData);
      await mettingAppAPI.createMeeting({ meetingData, actionItemsData });
      toast("Meeting data submitted successfully!");
      setMeetingData(null);
      setActionItemsData([]);
      setDescription("");
    } catch (err) {
      console.error("Failed to save meeting:", err);
      setError("Failed to submit meeting data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttendeesChange = (value: string) => {
    const attendeesArray = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    handleFieldChange("attendees", attendeesArray);
  };

  const handleDepartmentChange = (value: string) => {
    handleFieldChange("department", value);
  };

  const resetForm = () => {
    setMeetingData(null);
    setActionItemsData([]);
    setDescription("");
    setError("");
  };

  // Helper functions
  const getFieldValue = (field: string) => {
    return meetingData?.[field] || "";
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-blue-600" />
                AI Meeting Parser
              </CardTitle>
              <CardDescription>
                Convert meeting notes into structured meeting data.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {!meetingData ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Notes</label>
                    <Textarea
                      rows={10}
                      placeholder="Paste your meeting notes here..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="resize-none font-mono text-sm"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{description.length} characters</span>
                    </div>
                    {error && (
                      <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !description.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing Meeting...
                      </>
                    ) : (
                      "Parse Meeting Notes"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Review & Edit Meeting Data
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFinalSubmit}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Meeting"
                        )}
                      </Button>
                      <Button onClick={resetForm} variant="outline">
                        New Meeting
                      </Button>
                    </div>
                  </div>

                  {/* Meeting Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">Meeting Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Title + Date + Department */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Meeting Title</Label>
                          <Input
                            value={getFieldValue("title")}
                            onChange={(e) =>
                              handleFieldChange("title", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={getFieldValue("date")}
                            onChange={(e) =>
                              handleFieldChange("date", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Department</Label>
                          <Input
                            value={getFieldValue("department") || ""}
                            onChange={(e) =>
                              handleDepartmentChange(e.target.value)
                            }
                            placeholder="e.g., IT, HR, Management"
                          />
                        </div>
                      </div>

                      {/* Attendees */}
                      <div>
                        <Label>Attendees (comma-separated)</Label>
                        <Textarea
                          value={
                            Array.isArray(getFieldValue("attendees"))
                              ? getFieldValue("attendees").join(", ")
                              : getFieldValue("attendees") || ""
                          }
                          onChange={(e) =>
                            handleAttendeesChange(e.target.value)
                          }
                          placeholder="Mr. John, Mrs. Smith, Dr. Brown"
                          rows={2}
                        />
                      </div>

                      {/* Agenda */}
                      <div>
                        <Label>Agenda</Label>
                        <Textarea
                          value={getFieldValue("agenda")}
                          onChange={(e) =>
                            handleFieldChange("agenda", e.target.value)
                          }
                          rows={3}
                        />
                      </div>

                      {/* Minutes */}
                      <div>
                        <Label>Minutes</Label>
                        <Textarea
                          value={getFieldValue("minutes")}
                          onChange={(e) =>
                            handleFieldChange("minutes", e.target.value)
                          }
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Items Card - Separated */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-md">Action Items</CardTitle>
                        <CardDescription>
                          Tasks and assignments from the meeting
                        </CardDescription>
                      </div>
                      <Button
                        onClick={addActionItem}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Action Item
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {actionItemsData.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No action items yet. Click "Add Action Item" to
                            create one.
                          </p>
                        ) : (
                          actionItemsData.map((item: any, i: number) => (
                            <Card key={i} className="p-4 border-2">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-medium text-base">
                                  Action Item #{i + 1}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeActionItem(i)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={item.desc || ""}
                                    onChange={(e) =>
                                      handleActionItemChange(
                                        i,
                                        "desc",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Describe the action item..."
                                    rows={2}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Owner</Label>
                                    <Input
                                      value={item.owner || ""}
                                      onChange={(e) =>
                                        handleActionItemChange(
                                          i,
                                          "owner",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Assign owner..."
                                    />
                                  </div>
                                  <div>
                                    <Label>Due Date</Label>
                                    <Input
                                      type="date"
                                      value={item.due || ""}
                                      onChange={(e) =>
                                        handleActionItemChange(
                                          i,
                                          "due",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Status</Label>
                                    <Select
                                      value={item.status || "pending"}
                                      onValueChange={(v) =>
                                        handleActionItemChange(i, "status", v)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="completed">
                                          Completed
                                        </SelectItem>
                                        <SelectItem value="ongoing">
                                          Ongoing
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Penalty</Label>
                                    <Input
                                      value={item.penalty || "N/A"}
                                      onChange={(e) =>
                                        handleActionItemChange(
                                          i,
                                          "penalty",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Penalty for non-compliance..."
                                    />
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Formatting Guide</CardTitle>
              <CardDescription>Tips for best results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm space-y-1">
                <li>• Use full dates (e.g., October 15, 2025)</li>
                <li>• Include titles before names (Mr, Mrs)</li>
                <li>• Specify penalties clearly when mentioned</li>
                <li>• List all attendees explicitly</li>
                <li>• Use numbered points for action items</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UseAiBot;
