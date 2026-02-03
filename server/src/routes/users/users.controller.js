const User = require("../../models/user.schema");

async function syncUserProfile(req, res) {
  try {
    const erp_user = req.user;

    if (!erp_user || !erp_user.email) {
      return res.status(400).json({ error: "Invalid user data from token" });
    }

    const getMappedRole = (laravelRole) => {
      switch (laravelRole) {
        case "Admin Manager":
          return "admin";
        case "Moderator":
          return "moderator";
        default:
          return "user";
      }
    };

    const mappedRole = getMappedRole(erp_user.role);


    let user = await User.findOne({ email: erp_user.email });

    if (!user) {
      user = new User({
        displayName: erp_user.name,
        email: erp_user.email,
        username: erp_user.email.split("@")[0],
        phone: erp_user.phone,
        role: mappedRole,
        laravel_id: erp_user.id,
        department: erp_user.department.name,
      });
      await user.save();
    }

    const userResponse = {
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      laravel_id: user.laravel_id,
      department: user.department,
    };

    return res.status(200).json({
      message: "User profile synced successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("syncUserProfile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function isAuthenticated(req, res) {
  try {
    return res.status(200).json({ message: "Authenticated" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllusers(req, res) {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const currentUserEmail = req.user.email;

    let filter = {
      email: { $ne: currentUserEmail },
    };
    if (search) {
      filter = {
        $and: [
          { email: { $ne: currentUserEmail } },
          {
            $or: [
              { username: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }
    // Get users with pagination
    const users = await User.find(filter)
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const userData = await User.findById(id).select("-password");

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { syncUserProfile, getAllusers, getUserById, isAuthenticated };
