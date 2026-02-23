const Meeting = require("../../models/meeting.schema");
const ActionItem = require("../../models/meetingActionItems.schema");
const mongoose = require("mongoose");

const getMeetings = async (req, res) => {
  try {
    const { search, cursorTimestamp } = req.query;

    let query = {};

    // Cursor pagination
    if (cursorTimestamp) {
      query.createdAt = {
        $lt: new Date(cursorTimestamp),
      };
    }

    // Search filter
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

    res.status(200).json({
      meetings,
      nextCursor:
        meetings.length > 0 ? meetings[meetings.length - 1].createdAt : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    // ---- Validation ----
    if (!id) {
      return res.status(400).json({
        message: "Meeting id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid meeting id",
      });
    }

    // ---- Fetch Meeting ----
    const meeting = await Meeting.findById(id)
      .populate("attendees", "name email") // optional
      .populate("actionItems") // optional
      .lean();

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { meetingData, actionItemsData } = req.body;

    // 1️⃣ Create meeting inside transaction
    const meeting = await Meeting.create(meetingData);

    let createdActionItems = [];

    // 2️⃣ Create action items
    if (actionItemsData && actionItemsData.length > 0) {
      const formattedItems = actionItemsData.map((item) => ({
        ...item,
        meetingId: meeting._id,
      }));

      createdActionItems = await ActionItem.insertMany(formattedItems);

      // 3️⃣ Update meeting with action item IDs
      meeting.actionItems = createdActionItems.map((item) => item._id);

      await meeting.save();
    }

    res.status(201).json({
      message: "Meeting created successfully",
      meeting: meeting,
      actionItems: createdActionItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMeetings, getMeetingById, createMeeting };
