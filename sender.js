// CONFIGURATION
const CONFIG = {
  START_ROW: 8,                 // Start checking for checked boxes at this row
  NAME_COLUMN: 2,               // Column with names
  TEAM_COLUMN: 3,               // Column with team numbers
  EMAIL_COLUMN: 4,              // Column with email addresses (A=1, B=2...)
  CHECKBOX_COLUMN: 5,           // Column where the main checkbox lives
  EMAIL_SENT_COLUMN: 6,         // Column that tracks if we've already sent an email
  MASTER_SHEET_NAME: "Master Document", // Sheet name where data will be appended
  MESSAGE: "Hello,\n\nThis is an automated email to inform you that you have successfully been added to the 3128 Scouting Alliance. It may take 1–2 minutes before you are able to access our scouting systems. If it takes longer than expected or if you encounter any issues, please contact a member of the 3128 Strategy Team.\n\n -Team 3128, Aluminum Narwhals",
  SUBJECT: "Welcome to the 3128 Scouting Alliance"
};

// Runs when a cell is edited or manually if run directly
function onEdit(e) {
  if (!e) return manualScanAndSend();

  const range = e.range;
  const sheet = range.getSheet();
  const row = range.getRow();
  const col = range.getColumn();

  if (row < CONFIG.START_ROW || col !== CONFIG.CHECKBOX_COLUMN) return;

  const value = (typeof e.value === 'undefined') ? range.getValue() : e.value;
  const emailSentCell = sheet.getRange(row, CONFIG.EMAIL_SENT_COLUMN);
  const emailSent = emailSentCell.getValue();

  if ((value === true || value === "TRUE") && !(emailSent === true || emailSent === "TRUE")) {
    sendEmailAndRecord(sheet, row);
  }
}

// Manual run mode (scans all rows)
function manualScanAndSend() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();

  for (let r = CONFIG.START_ROW; r <= lastRow; r++) {
    const checkbox = sheet.getRange(r, CONFIG.CHECKBOX_COLUMN).getValue();
    const emailSent = sheet.getRange(r, CONFIG.EMAIL_SENT_COLUMN).getValue();
    if ((checkbox === true || checkbox === "TRUE") && !(emailSent === true || emailSent === "TRUE")) {
      Logger.log(`Found email to send at row ${r}`);
      sendEmailAndRecord(sheet, r);
    }
  }
}

// Sends email and adds row to Master Document
function sendEmailAndRecord(sheet, row) {
  try {
    const email = sheet.getRange(row, CONFIG.EMAIL_COLUMN).getValue();
    const name = sheet.getRange(row, CONFIG.NAME_COLUMN).getValue();
    const team = sheet.getRange(row, CONFIG.TEAM_COLUMN).getValue();

    if (!email || !email.toString().includes("@")) {
      Logger.log(`Invalid or missing email at row ${row}`);
      return;
    }

    // Send the email
    GmailApp.sendEmail(email.toString(), CONFIG.SUBJECT, CONFIG.MESSAGE);
    sheet.getRange(row, CONFIG.EMAIL_SENT_COLUMN).setValue(true);
    Logger.log(`Email sent to: ${email} (row ${row})`);

    // Record data in the Master Document sheet
    const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.MASTER_SHEET_NAME);
    if (masterSheet) {
      masterSheet.appendRow([name, team, email]);
      Logger.log(`Added to Master Document: ${name}, ${team}, ${email}`);
    } else {
      Logger.log("Error: 'Master Document' sheet not found.");
    }

  } catch (err) {
    Logger.log(`Error sending email for row ${row}: ${err}`);
  }
}
