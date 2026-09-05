import AdminIncExc from "../models/adminIncExc.model.js";
import Auth from "../models/auth.model.js";
import Notification from "../models/notification.model.js";

// @route   GET /admin/inc-exc-presets
// @desc    Get all inclusion/exclusion presets (optionally filtered by destination)
// @access  Private (Admin)
export const getIncExcPresets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.destination) {
      const destRegex = { $regex: req.query.destination.trim(), $options: "i" };
      filter.$or = [
        { destination: destRegex },
        { destinations: destRegex }
      ];
    }

    const presets = await AdminIncExc.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(presets);
  } catch (error) {
    console.error("Error fetching presets:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// @route   GET /admin/inc-exc-presets/:id
// @desc    Get single preset by ID
// @access  Private (Admin)
export const getIncExcPresetById = async (req, res) => {
  try {
    const preset = await AdminIncExc.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");
    
    if (!preset) {
      return res.status(404).json({ message: "Preset not found." });
    }
    res.status(200).json(preset);
  } catch (error) {
    console.error("Error fetching preset:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// @route   POST /admin/inc-exc-presets
// @desc    Create a new preset
// @access  Private (Admin)
export const createIncExcPreset = async (req, res) => {
  try {
    const { name, destinationCategory, destination, destinations, inclusions, exclusions } = req.body;

    // Check if preset with same name exists
    const existingPreset = await AdminIncExc.findOne({ name });
    if (existingPreset) {
      return res.status(400).json({ message: "A preset with this name already exists." });
    }

    // Normalize destinations array and destination string
    let destList = [];
    if (Array.isArray(destinations)) {
      destList = destinations.map(d => String(d).trim()).filter(Boolean);
    } else if (Array.isArray(destination)) {
      destList = destination.map(d => String(d).trim()).filter(Boolean);
    } else if (typeof destination === "string" && destination.trim()) {
      destList = destination.split(",").map(d => d.trim()).filter(Boolean);
    }

    const destinationStr = destList.length > 0 ? destList.join(", ") : (typeof destination === "string" ? destination.trim() : "");

    const currentUserId = req.user?._id || req.user?.id;
    const newPreset = new AdminIncExc({
      name,
      destinationCategory: destinationCategory || "",
      destination: destinationStr,
      destinations: destList,
      inclusions: inclusions || [],
      exclusions: exclusions || [],
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    const savedPreset = await newPreset.save();

    // Notify active Admins & Operation Managers
    try {
      let creatorName = req.user?.name || "Ops Team";
      let creatorRole = req.user?.role || "operations";

      if (currentUserId && !req.user?.name) {
        const creatorDoc = await Auth.findById(currentUserId).select("name role");
        if (creatorDoc) {
          creatorName = creatorDoc.name || creatorName;
          creatorRole = creatorDoc.role || creatorRole;
        }
      }

      const targetUsers = await Auth.find({
        role: { $in: ["admin", "operation_manager"] },
        _id: { $ne: currentUserId },
        isDeleted: { $ne: true },
        accountStatus: { $ne: "Inactive" },
      }).select("_id role");

      if (targetUsers.length > 0) {
        const destText = savedPreset.destination ? ` for ${savedPreset.destination}` : "";
        const notifications = targetUsers.map((targetUser) => ({
          user: targetUser._id,
          type: "info",
          title: "New Preset Saved",
          message: `${creatorName} saved a new Inclusion & Exclusion preset "${savedPreset.name}"${destText}.`,
          link: targetUser.role === "admin" ? "/admin/inclusions-exclusions" : "/operationManager/operationManagerDashboard",
          meta: {
            kind: "inc_exc_preset_created",
            presetId: savedPreset._id,
            presetName: savedPreset.name,
            destination: savedPreset.destination,
            destinations: savedPreset.destinations,
            createdById: currentUserId,
            createdByName: creatorName,
            createdByRole: creatorRole,
          },
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error("Error creating preset notifications:", notifErr);
    }

    res.status(201).json(savedPreset);
  } catch (error) {
    console.error("Error creating preset:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// @route   PUT /admin/inc-exc-presets/:id
// @desc    Update a preset
// @access  Private (Admin)
export const updateIncExcPreset = async (req, res) => {
  try {
    const { name, destinationCategory, destination, destinations, inclusions, exclusions } = req.body;

    const preset = await AdminIncExc.findById(req.params.id);
    if (!preset) {
      return res.status(404).json({ message: "Preset not found." });
    }

    // Check for name collision
    if (name && name !== preset.name) {
      const existingPreset = await AdminIncExc.findOne({ name });
      if (existingPreset) {
        return res.status(400).json({ message: "A preset with this name already exists." });
      }
      preset.name = name;
    }

    if (destinationCategory !== undefined) preset.destinationCategory = destinationCategory || "";
    
    if (destinations !== undefined || destination !== undefined) {
      let destList = [];
      if (Array.isArray(destinations)) {
        destList = destinations.map(d => String(d).trim()).filter(Boolean);
      } else if (Array.isArray(destination)) {
        destList = destination.map(d => String(d).trim()).filter(Boolean);
      } else if (typeof destination === "string" && destination.trim()) {
        destList = destination.split(",").map(d => d.trim()).filter(Boolean);
      }
      preset.destinations = destList;
      preset.destination = destList.length > 0 ? destList.join(", ") : (typeof destination === "string" ? destination.trim() : "");
    }

    if (inclusions) preset.inclusions = inclusions;
    if (exclusions) preset.exclusions = exclusions;
    preset.updatedBy = req.user?._id || req.user?.id;

    const updatedPreset = await preset.save();
    res.status(200).json(updatedPreset);
  } catch (error) {
    console.error("Error updating preset:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// @route   DELETE /admin/inc-exc-presets/:id
// @desc    Delete a preset
// @access  Private (Admin)
export const deleteIncExcPreset = async (req, res) => {
  try {
    const preset = await AdminIncExc.findById(req.params.id);
    if (!preset) {
      return res.status(404).json({ message: "Preset not found." });
    }
    
    await AdminIncExc.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Preset deleted successfully." });
  } catch (error) {
    console.error("Error deleting preset:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
