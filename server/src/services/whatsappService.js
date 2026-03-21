import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsAppMessage = async (quoteDetails) => {
 const message = `
*Holiday Circuit*

Dear ${quoteDetails.agentName},

Your travel quotation has been successfully prepared. A detailed quotation has been sent to your registered email address. Please review it for complete information.

Destination: ${quoteDetails.destination}
Total Amount: ₹${quoteDetails.totalAmount}
Valid Until: ${quoteDetails.validTill}

Kindly review the quotation at your convenience. We recommend confirming at the earliest to secure availability and pricing.

For any modifications or assistance, feel free to reply to this message.

Regards,  
Holiday Circuit Team
`;
  const res = await client.messages.create({
    from: "whatsapp:+14155238886",
    to: `whatsapp:+919368825518`,
    body: message,
  });

  console.log("WHATSAPP SENT:", res.sid);
  return { status: "sent", sid: res.sid };
};
