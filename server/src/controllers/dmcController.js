import Hotel from "../models/hotelDmc.model.js";
import Activity from "../models/activityDmc.model.js";
import Transfer from "../models/transferDmc.model.js";
import Package from "../models/PackageDmc.model.js";
import Sightseeing from "../models/sightseeingDmc.model.js"
import Auth from "../models/auth.model.js";
import UploadHistory from "../models/uploadHistory.model.js" 
import path from "path"
import fs from "fs"




/* ======================= HOTEL CONTROLLERS ================================= */

//----------------------- Create Hotel ---------------------------
export const createHotel = async (req, res, next) => {
  try {

    const { hotelName, city, pricePerNight, roomType, mealPlan } = req.body;

    if (!hotelName || !city || !pricePerNight) {
      const error = new Error("hotelName, city and pricePerNight are required");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check
    const existingHotel = await Hotel.findOne({
      hotelName,
      city,
      supplier: req.user.id
    });

    if (existingHotel) {
      const error = new Error("Hotel already exists for this supplier in this city");
      error.statusCode = 409;
      return next(error);
    }

    // supplier details
    const supplier = await Auth.findById(req.user.id);

    const serviceName = `${hotelName} ${roomType || ""} ${mealPlan || ""}`;

    const hotel = await Hotel.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: supplier.name,
      serviceName,
      serviceCategory: "hotel"
    });

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: hotel
    });

  } catch (error) {
    next(error);
  }
};


//------------------- GET ALL HOTELS  Controller -----------------------

export const getHotels = async (req, res, next) => {
  try {

    const hotels = await Hotel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });

  } catch (error) {
    next(error);
  }
};



// GET SINGLE HOTEL
export const getHotelById = async (req, res, next) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: hotel
    });

  } catch (error) {
    next(error);
  }
};



// UPDATE HOTEL
export const updateHotel = async (req, res, next) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      return next(error);
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: updatedHotel
    });

  } catch (error) {
    next(error);
  }
};

// DELETE HOTEL

export const deleteHotel = async (req, res, next) => {
  try {

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      return next(error);
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      message: "Hotel deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};




/* ============================= ACTIVITY CONTROLLERS ================================== */


//---------- CREATE ACTIVITY-------------
export const createActivity = async (req, res, next) => {
  try {

    const {
      name,
      country,
      city,
      adultPrice,
      childPrice,
      infantPrice,
      currency,
      validFrom,
      validTo
    } = req.body;

    // validation
    if (!name || !country || !city || !validFrom || !validTo) {
      const error = new Error("Required activity fields missing");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check
    const existingActivity = await Activity.findOne({
      name,
      city,
      supplier: req.user.id
    });

    if (existingActivity) {
      const error = new Error("Activity already exists for this supplier in this city");
      error.statusCode = 409;
      return next(error);
    }

    // supplier details
    const supplier = await Auth.findById(req.user.id);

    const serviceName = name;

    const activity = await Activity.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: supplier.name,
      serviceName,
      serviceCategory: "activity"
    });

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: activity
    });

  } catch (error) {
    next(error);
  }
};


//------------ All GET ACTIVITIES -----------------------------

export const getActivities = async (req, res, next) => {
  try {

    const activities = await Activity.find();

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    next(error);
  }
};


/* ======================================== TRANSFER CONTROLLERS ================================== */

//-------------------------- CREATE TRANSFER-----------------------------------
export const createTransfer = async (req, res, next) => {
  try {

    const {
      serviceName,
      country,
      city,
      vehicleType,
      passengerCapacity,
      luggageCapacity,
      price,
      currency,
      usageType,
      validFrom,
      validTo
    } = req.body;

    // validation
    if (!serviceName || !country || !city || !vehicleType || !price || !validFrom || !validTo) {
      const error = new Error( "Required transfer fields missing");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check 
    const existingTransfer = await Transfer.findOne({
      city,
      vehicleType,
      usageType,
      supplier: req.user.id
    });

    if (existingTransfer) {
      const error = new Error(
        "Transfer already exists for this vehicle type in this city"
      );
      error.statusCode = 409;
      return next(error);
    }

     //-------------------------- get supplier details ---------------------
    const supplier = await Auth.findById(req.user.id);
    console.log(supplier);


    const transfer = await Transfer.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: supplier.name,
      serviceCategory: "transport"
    });

    res.status(201).json({
      success: true,
      message: "Transfer created successfully",
      data: transfer
    });

  } catch (error) {
    next(error);
  }
};



//---------------- GET TRANSFERS -------------------
export const getTransfers = async (req, res, next) => {
  try {

    const transfers = await Transfer.find();

    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });

  } catch (error) {
    next(error);
  }
};


//========================================= CREATE SIGHTSEEING ===================================

export const createSightseeing = async (req, res, next) => {
  try {

    const {
      name,
      country,
      city,
      price,
      currency,
      validFrom,
      validTo
    } = req.body;

    // validation
    if (!name || !country || !city || !price || !validFrom || !validTo) {
      const error = new Error("Required sightseeing fields missing");
      error.statusCode = 400;
      return next(error);
    }

    // duplicate check
    const existingSightseeing = await Sightseeing.findOne({
      name,
      city,
      supplier: req.user.id
    });

    if (existingSightseeing) {
      const error = new Error(
        "Sightseeing already exists for this supplier in this city"
      );
      error.statusCode = 409;
      return next(error);
    }

    // supplier details
    const supplier = await Auth.findById(req.user.id);

    const serviceName = name;

    const sightseeing = await Sightseeing.create({
      ...req.body,
      supplier: req.user.id,
      supplierName: supplier.name,
      serviceName,
      serviceCategory: "sightseeing"
    });

    res.status(201).json({
      success: true,
      message: "Sightseeing created successfully",
      data: sightseeing
    });

  } catch (error) {
    next(error);
  }
};


//---------------- GET Sightseeing  -------------------
export const getSightseeing = async (req, res, next) => {
  try {

    const sightseeing = await Sightseeing.find()
      .populate("supplier", "name email");

    res.status(200).json({
      success: true,
      count: sightseeing.length,
      data: sightseeing
    });

  } catch (error) {
    next(error);
  }
};

/* ======================================== PACKAGE CONTROLLERS ======================================= */

//------------- CREATE PACKAGE ----------------------
export const createPackage = async (req, res, next) => {
  try {

    const {
      title,
      destination,
      days,
      hotels,
      activities,
      transfers,
      sightseeing,
      price
    } = req.body;

    if (!title || !destination || !price) {
      const error = new Error("Title, destination and price required");
      error.statusCode = 400;
      return next(error);
    }

    const pkg = await Package.create({
      title,
      destination,
      days,
      hotels,
      activities,
      transfers,
      sightseeing,
      price,
      supplier: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: pkg
    });

  } catch (error) {
    next(error);
  }
};



//----------- GET PACKAGES ---------------------------

export const getPackages = async (req, res, next) => {
  try {

    const packages = await Package.find()

      .populate("hotels", "hotelName roomType")
      .populate("activities", "name")
      .populate("transfers", "serviceName")
      .populate("sightseeing", "name");

    res.status(200).json({
      success: true,
      data: packages
    });

  } catch (error) {
    next(error);
  }
};

//======================= UPLOAD DELETE FILE CONTROLLER ========================================================

export const deleteUpload = async (req, res) => {
  try {
    const { id } = req.params

    const file = await UploadHistory.findById(id)

    if (!file) {
      return res.status(404).json({ message: "File not found" })
    }

    // server se file delete
    if (file.filePath && fs.existsSync("." + file.filePath)) {
      fs.unlinkSync("." + file.filePath)
    }

    // DB se delete
    await UploadHistory.findByIdAndDelete(id)

    res.json({ message: "Deleted successfully" })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

//========================= DOWNLOAD FILE DMC BULK ==============================================


export const downloadUpload = async (req, res) => {
  try {
    const { id } = req.params

    const file = await UploadHistory.findById(id)

    if (!file || !file.filePath) {
      return res.status(404).json({ message: "File not found in DB" })
    }

    // 🔥 ADD THESE LOGS HERE
    console.log("CWD:", process.cwd())
    console.log("FILE PATH FROM DB:", file.filePath)

    const fullPath = path.join(process.cwd(), file.filePath)

    console.log("FINAL PATH:", fullPath)

    if (!fs.existsSync(fullPath)) {
      console.log("❌ FILE NOT FOUND")
      return res.status(404).json({ message: "File missing on server" })
    }

    res.download(fullPath)

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message })
  }
}


// ======================= GET ALL SERVICES (QUOTATION BUILDER) =======================

export const getAllServices = async (req, res, next) => {
  try {

    const [hotels, activities, transfers, sightseeing] = await Promise.all([
      Hotel.find(),
      Activity.find(),
      Transfer.find(),
      Sightseeing.find()
    ]);

    // 🔹 FORMAT HOTELS
    const hotelData = hotels.map(h => ({
      id: h._id,
      type: "hotel",
      title: h.hotelName,
      description: h.description || `${h.roomType || ""} | ${h.mealPlan || ""}`,
      country:h.country,
      city:h.city,
      price: h.price,
      currency: h.currency
    }));

    // 🔹 FORMAT ACTIVITIES
    const activityData = activities.map(a => ({
      id: a._id,
      type: "activity",
      title: a.name,
      subtitle: `${a.city} | Activity`,
      price: a.adultPrice || a.price,
      currency: a.currency
    }));

    // 🔹 FORMAT TRANSFERS
    const transferData = transfers.map(t => ({
      id: t._id,
      type: "transfer",
      title: t.serviceName,
      subtitle: `${t.vehicleType} | ${t.usageType}`,
      price: t.price,
      currency: t.currency
    }));

    // 🔹 FORMAT SIGHTSEEING
    const sightseeingData = sightseeing.map(s => ({
      id: s._id,
      type: "sightseeing",
      title: s.name,
      subtitle: `${s.city} | Sightseeing`,
      price: s.price,
      currency: s.currency,
      description: s.description || `${s.roomType || ""} | ${s.mealPlan || ""}`,
      city:s.city,
      price:s.price,
    }));

    // 🔥 MERGE ALL
    const allServices = [
      ...hotelData,
      ...activityData,
      ...transferData,
      ...sightseeingData
    ];

    res.status(200).json({
      success: true,
      count: allServices.length,
      data: allServices
    });

  } catch (error) {
    next(error);
  }
};