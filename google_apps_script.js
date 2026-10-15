/**
 * ==============================================================================
 * MADHAVBAUG DIABOMATIC™ SHOTS - GOOGLE APPS SCRIPT WEBHOOK CODE
 * ==============================================================================
 * Instructions to Deploy:
 * 1. Open your Google Sheet where you want leads to be collected.
 * 2. Click on "Extensions" (एक्सटेंशन) -> "Apps Script".
 * 3. Delete any default code in Code.gs, paste all the code below, and click "Save" (💾).
 * 4. Click "Deploy" (डिप्लॉय) button at top right -> Select "New deployment" (नया डिप्लॉयमेंट).
 * 5. Click the gear icon ⚙️ next to 'Select type' and choose "Web app".
 * 6. Set Description: "Diabomatic Shots Leads Webhook"
 * 7. Set "Execute as": "Me" (your email)
 * 8. Set "Who has access": "Anyone" (अत्यंत महत्वपूर्ण: Anyone सेलेक्ट करें)
 * 9. Click "Deploy" and authorize permissions.
 * 10. Copy the generated "Web App URL" (e.g., https://script.google.com/macros/s/.../exec)
 *     and paste it in assets/js/main.js at GOOGLE_SHEETS_WEBHOOK_URL.
 * ==============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rawData = e.postData.contents;
    var data;

    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter;
    }

    // Auto-create header row if sheet is newly created
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp (तारीख व समय)",
        "Order ID",
        "Name (ग्राहक का नाम)",
        "Contact (मोबाइल नंबर)",
        "Address (पता)",
        "City (शहर)",
        "State (राज्य)",
        "Package (चुना गया पैक)",
        "Price (मूल्य)",
        "Payment Mode (भुगतान)",
        "Page URL"
      ]);
      // Format header row with Madhavbaug Burgundy color
      var headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#7E1826");
      headerRange.setFontColor("#FFFFFF");
    }

    var contactNumber = String(data.contact || "").replace(/\D/g, "").slice(-10);

    // 24-Hour Duplicate Submission Check in Google Sheet
    if (contactNumber && contactNumber.length === 10) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues(); // Timestamp(0), OrderID(1), Name(2), Contact(3)
        var now = new Date();
        var oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (var i = values.length - 1; i >= 0; i--) {
          var rowContact = String(values[i][3] || "").replace(/\D/g, "").slice(-10);
          if (rowContact === contactNumber) {
            var rowTime = new Date(values[i][0]);
            // If submitted within last 24 hours, respond with already_submitted
            if (isNaN(rowTime.getTime()) || rowTime >= oneDayAgo) {
              return ContentService
                .createTextOutput(JSON.stringify({
                  status: "already_submitted",
                  message: "Already submitted form. Wait for 24hr, our representative will call you."
                }))
                .setMimeType(ContentService.MimeType.JSON);
            }
          }
        }
      }
    }

    // Append new lead
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.orderId || ("MDB-COD-" + Math.floor(10000 + Math.random() * 90000)),
      data.name || "",
      data.contact ? "'" + data.contact : "", // Leading apostrophe preserves phone formatting in Excel/Sheets
      data.address || "",
      data.city || "",
      data.state || "",
      data.package || "",
      data.price || "",
      data.paymentMode || "Cash On Delivery (COD)",
      data.pageUrl || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Lead saved successfully",
        orderId: data.orderId
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Madhavbaug Diabomatic Shots Webhook is active and running!");
}
