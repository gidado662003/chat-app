const {
  getMeetings: getMeetingsService,
  getMeetingById: getMeetingByIdService,
  createMeeting: createMeetingService,
} = require("../../services/meeting.service");

const getMeetings = async (req, res) => {
  try {
    const data = await getMeetingsService(req.query);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await getMeetingByIdService(id);
    res.status(200).json(meeting);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { meetingData, actionItemsData } = req.body;
    const { meeting, actionItems } = await createMeetingService({
      meetingData,
      actionItemsData,
    });

    res.status(201).json({
      message: "Meeting created successfully",
      meeting,
      actionItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 

module.exports = { getMeetings, getMeetingById, createMeeting };
