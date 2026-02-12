"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MeetingPreview } from "@/lib/meetingAppTypes";

interface Props {
  meeting: MeetingPreview;
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ongoing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function MeetingPreviewCard({ meeting }: Props) {
  const date = new Date(meeting.date);
  const isPast = date < new Date();
  console.log(meeting);

  return (
    <Link
      href={`/meeting-app/${meeting._id}`}
      className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      <Card className="hover:border-primary/50 hover:shadow-sm transition-all duration-200">
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
                {meeting.title}
              </h3>
              <Badge
                className={`capitalize shrink-0 ${
                  statusColors[meeting.status as keyof typeof statusColors] ||
                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {meeting.status}
              </Badge>
            </div>

            {/* Department */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{meeting.department}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <time
                dateTime={meeting.date}
                className={
                  isPast
                    ? "text-muted-foreground"
                    : "text-foreground font-medium"
                }
              >
                {format(date, "EEE, MMM d, yyyy")}
                {!isPast && " • Upcoming"}
              </time>
            </div>

            {/* Optional: Participant count if available */}
            {/* {meeting.participantCount && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{meeting.participantCount} participants</span>
              </div>
            )} */}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
