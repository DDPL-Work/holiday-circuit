// import express from "express"
// import multer from "multer"
// import path from "path"
// import bulkUpload from "../controllers/bulkUploadController.js"
// import isAuthenticated from "../middlewares/auth.middleware.js"

// const router = express.Router()

// const storage = multer.diskStorage({

//  destination: function (req, file, cb) {
//   cb(null, "uploads/")
//  },

//  filename: function (req, file, cb) {
//   cb(null, Date.now() + "-" + file.originalname)
//  }

// })

// const fileFilter = (req, file, cb) => {

//  const allowedTypes = [
//   ".pdf",
//   ".xlsx",
//   ".xls",
//   ".doc",
//   ".docx"
//  ]

//  const ext = path.extname(file.originalname).toLowerCase()
//  if (allowedTypes.includes(ext)) {
//   cb(null, true)
//  } else {
//   cb(new Error("Only PDF, Excel and Word files are allowed"), false)
//  }}
// const upload = multer({storage,fileFilter})
// router.post("/bulk-upload", upload.single("file"),isAuthenticated, bulkUpload)

// export default router