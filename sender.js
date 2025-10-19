// CONFIGURATION
const CONFIG = {
  START_ROW: 8,
  NAME_COLUMN: 2,
  TEAM_COLUMN: 3,
  EMAIL_COLUMN: 4,
  VERIFY_COLUMN: 5,
  EMAIL_SENT_COLUMN: 6,
  MASTER_ADDED_COLUMN: 7,
  FIREBASE_ADDED_COLUMN: 8,
  MASTER_SHEET_NAME: "Master Document",

  // Firebase configuration placeholders
  FIREBASE_PROJECT_ID: "YOUR_FIREBASE_PROJECT_ID",
  FIREBASE_COLLECTION: "YOUR_FIREBASE_COLLECTION",
  FIREBASE_DATABASE: "(default)",
  FIREBASE_CREDENTIAL_FILE_ID: "YOUR_FIREBASE_CREDENTIAL_FILE_ID", // private Drive file ID

  // Email configuration
  SUBJECT: "Welcome to the 3128 Scouting Alliance",
  MESSAGE:
    "Hello,\nThis is an automated email to inform you that you have successfully been added to the 3128 Scouting Alliance. It may take 1–2 minutes before you are able to access our scouting systems. If it takes longer than expected or if you encounter any issues, please contact a member of the 3128 Strategy Team.\n\n -Team 3128, Aluminum Narwhals"
};


// Load Firebase credentials
const FIREBASE_CREDENTIALS = getFirebaseCredentials();

// TRIGGER HANDLER
function onEdit(e) {
  if (!e) return manualScanAndSend();

  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (row < CONFIG.START_ROW || col !== CONFIG.VERIFY_COLUMN) return;

  const verify = e.range.getValue();
  const emailSent = sheet.getRange(row, CONFIG.EMAIL_SENT_COLUMN).getValue();
  const masterAdded = sheet.getRange(row, CONFIG.MASTER_ADDED_COLUMN).getValue();
  const firebaseAdded = sheet.getRange(row, CONFIG.FIREBASE_ADDED_COLUMN).getValue();

  if (verify === true || verify === "TRUE") {
    sendEmailAndRecord(sheet, row, emailSent, masterAdded, firebaseAdded);
  }
}

// MANUAL SCAN
function manualScanAndSend() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();

  for (let r = CONFIG.START_ROW; r <= lastRow; r++) {
    const verify = sheet.getRange(r, CONFIG.VERIFY_COLUMN).getValue();
    const emailSent = sheet.getRange(r, CONFIG.EMAIL_SENT_COLUMN).getValue();
    const masterAdded = sheet.getRange(r, CONFIG.MASTER_ADDED_COLUMN).getValue();
    const firebaseAdded = sheet.getRange(r, CONFIG.FIREBASE_ADDED_COLUMN).getValue();

    if (verify === true || verify === "TRUE") {
      sendEmailAndRecord(sheet, r, emailSent, masterAdded, firebaseAdded);
    }
  }
}

// MAIN LOGIC
function sendEmailAndRecord(sheet, row, emailSent, masterAdded, firebaseAdded) {
  const email = sheet.getRange(row, CONFIG.EMAIL_COLUMN).getValue();
  const name = sheet.getRange(row, CONFIG.NAME_COLUMN).getValue();
  const team = sheet.getRange(row, CONFIG.TEAM_COLUMN).getValue();

  if (!email || !email.toString().includes("@")) return;

  try {
    if (!(emailSent === true || emailSent === "TRUE")) {
      GmailApp.sendEmail(email.toString(), CONFIG.SUBJECT, CONFIG.MESSAGE);
      sheet.getRange(row, CONFIG.EMAIL_SENT_COLUMN).setValue(true);
    }

    if (!(masterAdded === true || masterAdded === "TRUE")) {
      const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.MASTER_SHEET_NAME);
      if (masterSheet) masterSheet.appendRow([name, team, email]);
      sheet.getRange(row, CONFIG.MASTER_ADDED_COLUMN).setValue(true);
    }

    if (!(firebaseAdded === true || firebaseAdded === "TRUE")) {
      const firebaseResponse = addToFirebase(email, name, team);
      if (firebaseResponse) sheet.getRange(row, CONFIG.FIREBASE_ADDED_COLUMN).setValue(true);
    }

  } catch (err) {
    Logger.log(`Error processing row ${row}: ${err}`);
  }
}

// FIREBASE FUNCTION (SERVICE ACCOUNT)
function addToFirebase(email, name, team) {
  try {
    const token = getFirebaseToken();
    const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/${CONFIG.FIREBASE_DATABASE}/documents/${CONFIG.FIREBASE_COLLECTION}/${encodeURIComponent(email)}`;

    const payload = {
      fields: {
        Name: { stringValue: name.toString() },
        Team: { integerValue: Number(team) }
      }
    };

    const options = {
      method: "PATCH",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    Logger.log(`Firebase response code for ${email}: ${code}`);
    return code === 200 || code === 201;

  } catch (err) {
    Logger.log(`Firebase error for ${email}: ${err}`);
    return false;
  }
}

// FETCH FIREBASE CREDENTIALS FROM DRIVE
function getFirebaseCredentials() {
  const file = DriveApp.getFileById(CONFIG.FIREBASE_CREDENTIAL_FILE_ID);
  const jsonContent = file.getBlob().getDataAsString();
  return JSON.parse(jsonContent);
}

// GENERATE OAUTH TOKEN FOR FIREBASE
function getFirebaseToken() {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: FIREBASE_CREDENTIALS.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const signature = Utilities.computeRsaSha256Signature(
    `${encodedHeader}.${encodedPayload}`,
    FIREBASE_CREDENTIALS.private_key
  );
  const jwt = `${encodedHeader}.${encodedPayload}.${Utilities.base64EncodeWebSafe(signature)}`;

  const tokenResponse = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    }
  });

  const token = JSON.parse(tokenResponse.getContentText());
  return token.access_token;
}
