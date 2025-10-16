// CONFIGURATION
// This is where you set up all the main options for the script
const CONFIG = {
  START_ROW: 1,                 // Start checking for checked boxes at this row
  EMAIL_COLUMN: 4,              // Column with email addresses (A=1, B=2...)
  CHECKBOX_COLUMN: 5,           // Column where the main checkbox lives
  EMAIL_SENT_COLUMN: 6,         // Column that tracks if we've already sent an email
  MESSAGE: "Hello,\nThis is an automated email to inform you that you have successfully been added to the 3128 Scouting Alliance. It may take 1–2 minutes before you are able to access our scouting systems. If it takes longer than expected or if you encounter any issues, please contact a member of the 3128 Strategy Team.\n\n -Team 3128, Aluminum Narwhals",
  SUBJECT: "Welcome to the 3128 Scouting Alliance"  // The email subject line
};

// MAIN FUNCTION
// Runs whenever a cell in the sheet is edited or manually if you hit "Run" in Apps Script
function onEdit(e) {
  // If there’s no edit event (manual run), scan the sheet for unsent emails
  if (!e) return manualScanAndSend();

  const range = e.range;
  const sheet = range.getSheet();
  const row = range.getRow();
  const col = range.getColumn();

  // Only act if the edit was in the right column and row
  if (row < CONFIG.START_ROW || col !== CONFIG.CHECKBOX_COLUMN) return;

  const value = (typeof e.value === 'undefined') ? range.getValue() : e.value;

  const emailSentCell = sheet.getRange(row, CONFIG.EMAIL_SENT_COLUMN);
  const emailSent = emailSentCell.getValue();

  // Send email only if the checkbox is checked and we haven’t sent an email yet
  if ((value === true || value === "TRUE") && !(emailSent === true || emailSent === "TRUE")) {
    sendEmailForRow(sheet, row);
  }
}

// MANUAL SCAN FOR UNSENT EMAILS
// If you run the script manually, this will go through all rows
// starting at START_ROW and send emails for any checked boxes
// that haven’t already been sent.
function manualScanAndSend() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();

  for (let r = CONFIG.START_ROW; r <= lastRow; r++) {
    const checkbox = sheet.getRange(r, CONFIG.CHECKBOX_COLUMN).getValue();
    const emailSent = sheet.getRange(r, CONFIG.EMAIL_SENT_COLUMN).getValue();

    if ((checkbox === true || checkbox === "TRUE") && !(emailSent === true || emailSent === "TRUE")) {
      Logger.log(`Found email to send at row ${r}`);
      sendEmailForRow(sheet, r);
    }
  }
}

// SEND EMAIL HELPER
// Sends an email to the address in the row and checks the "Email Sent" box (takes a sec)
function sendEmailForRow(sheet, row) {
  try {
    const email = sheet.getRange(row, CONFIG.EMAIL_COLUMN).getValue();
    if (!email || !email.toString().includes("@")) {
      Logger.log(`Invalid or missing email at row ${row}`);
      return;
    }

    GmailApp.sendEmail(email.toString(), CONFIG.SUBJECT, CONFIG.MESSAGE);
    sheet.getRange(row, CONFIG.EMAIL_SENT_COLUMN).setValue(true);
    Logger.log(`Email sent to: ${email} (row ${row})`);
  } catch (err) {
    Logger.log(`Error sending email for row ${row}: ${err}`);
  }
}
