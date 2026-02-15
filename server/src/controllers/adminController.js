import Auth from "../models/auth.model.js";
import ApiError from "../utils/ApiError.js";

export const approveAgent = async (req, res, next) => {
  try {
    const agent = await Auth.findById(req.params.id);

    if (!agent || agent.role !== "agent") {
      return next(new ApiError(404, "Agent not found"));
    }

    agent.isApproved = true;
    await agent.save();

    res.status(200).json({ success: true, message: "Agent approved successfully", });

  } catch (error) {
    next(error);
  }
};
