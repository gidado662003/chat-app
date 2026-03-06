const mongoose = require("mongoose");
const Meeting = require("../models/meeting.schema");
const ActionItem = require("../models/meetingActionItems.schema");

async function getMeetings(queryParams) {
  const { search, cursorTimestamp } = queryParams;

  const query = {};

  if (cursorTimestamp) {
    query.createdAt = {
      $lt: new Date(cursorTimestamp),
    };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { minutes: { $regex: search, $options: "i" } },
      { agenda: { $regex: search, $options: "i" } },
    ];
  }

  const meetings = await Meeting.find(query)
    .select("title date department status createdAt _id")
    .sort({ createdAt: -1 })
    .limit(8);

  const nextCursor =
    meetings.length > 0 ? meetings[meetings.length - 1].createdAt : null;

  return { meetings, nextCursor };
}

async function getMeetingById(id) {
  if (!id) {
    const error = new Error("Meeting id is required");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid meeting id");
    error.statusCode = 400;
    throw error;
  }

  const meeting = await Meeting.findById(id)
    .populate("attendees", "name email")
    .populate("actionItems")
    .lean();

  if (!meeting) {
    const error = new Error("Meeting not found");
    error.statusCode = 404;
    throw error;
  }

  return meeting;
}

async function createMeeting(payload) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { meetingData, actionItemsData } = payload;

    const meeting = await Meeting.create([meetingData], { session });

    let createdActionItems = [];

    if (actionItemsData && actionItemsData.length > 0) {
      const formattedItems = actionItemsData.map((item) => ({
        ...item,
        meetingId: meeting[0]._id,
      }));

      createdActionItems = await ActionItem.insertMany(formattedItems, {
        session,
      });

      meeting[0].actionItems = createdActionItems.map((item) => item._id);

      await meeting[0].save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return {
      meeting: meeting[0],
      actionItems: createdActionItems,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

module.exports = { getMeetings, getMeetingById, createMeeting };

