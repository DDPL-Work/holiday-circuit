import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
 host: process.env.EMAIL_HOST,
 port: process.env.EMAIL_PORT,
 secure:false,
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

   tls: {
        rejectUnauthorized: false,
    },
});


export const sendAgentApprovalMail = async (email) => {
  await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Agent Registration Received",
    html: `
      <p>Thank you for registering as an Agent.</p>
      <p>Your profile is under review.</p>
      <p><strong>You will be able to access the Agent Dashboard within 24–48 hours after approval.</strong></p>
      <p>Team Holiday Circuit</p>
    `,
  });
};