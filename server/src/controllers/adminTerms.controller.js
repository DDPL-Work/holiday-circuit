import AdminTerm from "../models/adminTerms.js";

const getAuthenticatedUserId = (req) => req.user?.id || req.user?._id || null;

const formatTermDate = (date) => {
  const d = new Date(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()} ${hours}:${minutes} ${ampm}`;
};

export const createTermsAndConditions = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, content } = req.body;
    if (!name || !content) return res.status(400).json({ message: "Name and content are required" });

    const newTerm = new AdminTerm({
      name,
      content,
      createdBy: userId,
      revisions: [{
        content,
        updatedBy: userId,
        action: "Created"
      }]
    });

    await newTerm.save();
    await newTerm.populate("createdBy", "name");

    const formattedTerm = {
      id: newTerm._id,
      name: newTerm.name,
      by: newTerm.createdBy?.name || 'Agent',
      on: formatTermDate(newTerm.createdAt),
      content: newTerm.content,
      revisions: newTerm.revisions
    };

    res.status(201).json(formattedTerm);
  } catch (error) {
    next(error);
  }
};

export const updateTermsAndConditions = async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { name, content } = req.body;
    
    const term = await AdminTerm.findById(id);
    if (!term) return res.status(404).json({ message: "Term not found" });

    if (content && content !== term.content) {
      term.revisions.push({
        content,
        updatedBy: userId,
        action: "Updated"
      });
      term.content = content;
    }
    
    if (name) term.name = name;

    await term.save();
    await term.populate("createdBy revisions.updatedBy", "name");

    const formattedTerm = {
      id: term._id,
      name: term.name,
      by: term.createdBy?.name || 'Agent',
      on: formatTermDate(term.createdAt),
      content: term.content,
      revisions: term.revisions
    };

    res.status(200).json(formattedTerm);
  } catch (error) {
    next(error);
  }
};

export const fetchTermsAndConditions = async (req, res, next) => {
  try {
    const terms = await AdminTerm.find().populate("createdBy", "name").sort({ createdAt: -1 });
    
    const formattedTerms = terms.map(term => ({
      id: term._id,
      name: term.name,
      by: term.createdBy?.name || 'Agent',
      on: formatTermDate(term.createdAt),
      content: term.content
    }));

    res.status(200).json(formattedTerms);
  } catch (error) {
    next(error);
  }
};

export const fetchByIDTermsAndConditions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const term = await AdminTerm.findById(id).populate("createdBy revisions.updatedBy", "name");
    
    if (!term) return res.status(404).json({ message: "Term not found" });

    const formattedTerm = {
      id: term._id,
      name: term.name,
      by: term.createdBy?.name || 'Agent',
      on: formatTermDate(term.createdAt),
      content: term.content,
      revisions: term.revisions.map(rev => ({
         _id: rev._id,
         content: rev.content,
         action: rev.action,
         updatedAt: rev.updatedAt,
         formattedDate: formatTermDate(rev.updatedAt),
         by: rev.updatedBy?.name || 'Agent'
      }))
    };

    res.status(200).json(formattedTerm);
  } catch (error) {
    next(error);
  }
};

export const deleteTermsAndConditions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const term = await AdminTerm.findByIdAndDelete(id);
    if (!term) return res.status(404).json({ message: "Term not found" });

    res.status(200).json({ message: "Term deleted successfully" });
  } catch (error) {
    next(error);
  }
};