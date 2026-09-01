import AdminIncExc from "../models/adminIncExc.model.js";

// @route   GET /admin/inc-exc-presets
// @desc    Get all inclusion/exclusion presets
// @access  Private (Admin)
export const getIncExcPresets = async (req, res) => {
  try {
    const presets = await AdminIncExc.find()
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
    const { name, inclusions, exclusions } = req.body;

    // Check if preset with same name exists
    const existingPreset = await AdminIncExc.findOne({ name });
    if (existingPreset) {
      return res.status(400).json({ message: "A preset with this name already exists." });
    }

    const newPreset = new AdminIncExc({
      name,
      inclusions: inclusions || [],
      exclusions: exclusions || [],
      createdBy: req.user?._id || req.user?.id,
      updatedBy: req.user?._id || req.user?.id,
    });

    const savedPreset = await newPreset.save();
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
    const { name, inclusions, exclusions } = req.body;

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
