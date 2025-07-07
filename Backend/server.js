const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const dotenv = require("dotenv");
const url = require("url");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Escape helper (exactly like GitHub example)
function jsStringEscape(str) {
  return str.replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
}

// Payload builder (used to sign)
function createPayloadToSign(urlPath, body = "") {
  const parsedUrl = new url.URL(urlPath, "https://api.ikhokha.com"); // Base needed for WHATWG URL
  const basePath = parsedUrl.pathname;
  if (!basePath) throw new Error("No basePath in url");
  const payload = basePath + body;
  return jsStringEscape(payload);
}

app.post("/api/create-payment", async (req, res) => {
  try {
    const {
      amount,
      externalEntityID = "StreetDrip123",
      externalTransactionID = "SDTX-" + Date.now(),
    } = req.body;

   const paymentPayload = {
  amount,
  entityID: "141112", // Your actual iKhokha Merchant ID
  externalEntityID,
  externalTransactionID,
  currency: "ZAR",
  mode: "live",
  requesterUrl: "https://www.facebook.com/MalehoETlale/", // Use your production domain later
  description: "Street Drip Order",
  paymentReference: externalTransactionID,
  urls: {
    callbackUrl: "https://streetdrip.co.za/webhook", // optional
    successPageUrl: "https://streetdrip.co.za/success",
    failurePageUrl: "https://streetdrip.co.za/failure",
    cancelUrl: "https://streetdrip.co.za/cancel",
  },
};


    const endpointPath = "/public-api/v1/api/payment";
    const stringBody = JSON.stringify(paymentPayload);
    const payloadToSign = createPayloadToSign(endpointPath, stringBody);

    const signature = CryptoJS.HmacSHA256(
      payloadToSign,
      process.env.IK_APP_SECRET.trim()
    ).toString(CryptoJS.enc.Hex);

    const response = await axios.post(
  "https://api.ikhokha.com/public-api/v1/api/payment",
  stringBody,
  {
    headers: {
      "Content-Type": "application/json",
      "IK-APPID": process.env.IK_APP_KEY.trim(),
      "IK-SIGN": signature,
    },
  }
);


    return res.json(response.data);
  } catch (error) {
    console.error("❌ iKhokha payment failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Payment failed",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
