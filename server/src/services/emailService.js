import nodemailer from "nodemailer";

export const sendEmailQuote = async (email, quoteDetails) => {

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

const htmlTemplate = `
  <div style="background: #f0ede8; padding: 40px 20px; font-family: Georgia, serif;">
    <div style="max-width: 580px; margin: auto; background: #fff; border-radius: 2px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.12);">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 48px 40px 36px; text-align: center;">
        <div style="display: inline-block; border: 1px solid rgba(212,175,55,0.4); padding: 4px 18px; border-radius: 20px; margin-bottom: 16px;">
          <span style="color: #d4af37; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-family: Arial, sans-serif;">Travel Quotation</span>
        </div>
        <h1 style="color: #fff; margin: 0 0 6px; font-size: 28px; font-weight: normal; letter-spacing: 2px;">Holiday Circuit</h1>
        <div style="width: 40px; height: 2px; background: linear-gradient(90deg, #d4af37, #f0c040); margin: 12px auto 0;"></div>
      </div>

      <!-- Body -->
      <div style="padding: 40px 40px 32px;">

        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 6px;">
          Dear <strong style="color: #1a1a2e;">${quoteDetails.name || 'Customer'}</strong>,
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
          We're delighted to present your personalized travel quotation. Please review the details below.
        </p>

        <!-- Destination Banner -->
        <div style="background: linear-gradient(135deg, #f8f4ef, #f0ede8); border-left: 3px solid #d4af37; padding: 16px 20px; margin-bottom: 28px; border-radius: 0 4px 4px 0;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999; font-family: Arial, sans-serif;">Your Destination</p>
          <p style="margin: 6px 0 0; font-size: 22px; color: #1a1a2e; letter-spacing: 0.5px;">${quoteDetails.destination}</p>
        </div>

        <!-- Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #999; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif; width: 45%;">Duration</td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #1a1a2e; font-size: 15px; font-weight: bold; text-align: right;">${quoteDetails.days} Days</td>
          </tr>
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #999; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif;">Total Amount</td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #1a1a2e; font-size: 18px; font-weight: bold; text-align: right;">
              <span style="color: #d4af37;">₹</span>${quoteDetails.price}
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 0; color: #999; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif;">Valid Till</td>
            <td style="padding: 14px 0; color: #1a1a2e; font-size: 15px; font-weight: bold; text-align: right;">${quoteDetails.validTill}</td>
          </tr>
        </table>

        <p style="color: #888; font-size: 13px; line-height: 1.7; text-align: center; margin: 0;">
          Questions? Reply to this email or call us at <strong style="color: #1a1a2e;">+91 XXXXX XXXXX</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f8f4ef; padding: 24px 40px; text-align: center; border-top: 1px solid #e8e3dd;">
        <p style="margin: 0 0 4px; color: #1a1a2e; font-size: 14px; letter-spacing: 1px; font-weight: bold; font-family: Arial, sans-serif;">HOLIDAY CIRCUIT</p>
        <p style="margin: 0; color: #aaa; font-size: 11px; font-family: Arial, sans-serif;">Your Journey, Our Passion</p>
      </div>

    </div>
  </div>
`;

   const info = await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Quotation - ${quoteDetails.destination}`,
    html: htmlTemplate,
  });
  console.log("EMAIL SENT:", info.response);
  return { status: "sent", email }; // 👈 IMPORTANT
};