"use client";

import { useEffect, useState } from "react";
import MeetingPreviewCard from "@/components/meeting-app/MeetingPreviewCard";
import { MeetingPreview } from "@/lib/meetingAppTypes";
import { mettingAppAPI } from "@/lib/mettingAppApi";

export default function MeetingListBox() {
  const [meetings, setMeetings] = useState<MeetingPreview[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  console.log(meetings);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchMeetings = async () => {
      const response = await mettingAppAPI.getMeetings("", "");
      console.log(response);

      setMeetings(response.meetings);
      setNextCursor(response.nextCursor);
    };
    fetchMeetings();
  }, []);

  return (
    <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 justify-center items-center w-full space-y-3 max-h-screen overflow-y-auto">
      {meetings.map((meeting: any) => (
        <div key={meeting._id}>
          <MeetingPreviewCard
            key={meeting._id}
            meeting={meeting}
            // nextCursor={nextCursor}
          />
        </div>
      ))}
    </div>
  );
}
