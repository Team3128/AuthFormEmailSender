# AuthFormEmailSender

**AuthFormEmailSender** is a Google Apps Script that automates the process of verifying new members in your Google Sheet.  

When a 3128 member marks a response as "verified":  
1. It sends an email notifying the respondent that they have been accepted into 3128's scouting alliance.  
2. It adds the respondent’s information (name, team, email) to a master sheet.  
3. It updates your Firebase Firestore database with the new member's information. (overrides previous info) 

---

## Features
- Automatic email sending via Gmail.
- Master sheet tracking in Google Sheets.
- Firebase integration to store member info.
- Manual scanning for testing.
- IF at any point you do NOT want to send an automated email/add a user to the master sheet/firebase, check that respective box BEFORE checking the "verified" column.


---

## Setup Instructions

1. Copy of the sender.js & paste it into a scripts in whatever google sheet you want the auth form to be in (probably linked to an auth form). 
2. **Replace placeholder values** in `CONFIG` with your own:  
   ```javascript
   FIREBASE_PROJECT_ID: "YOUR_FIREBASE_PROJECT_ID"
   FIREBASE_COLLECTION: "YOUR_FIREBASE_COLLECTION"
   FIREBASE_DATABASE: "(default)" // usually leave as "(default)"
   FIREBASE_CREDENTIAL_FILE_ID: "YOUR_FIREBASE_CREDENTIAL_FILE_ID" // Drive file ID of your service account JSON. You need to download a service account key (admin), and then place it into your drive. Share it with the email that is running the script (not the user who is checking the boxes but rather the one who owns the script).
   SUBJECT: "Your email subject here"
   MESSAGE: "Your email message here"


MIT License

Copyright (c) 2025 Dhruv Bantval- Team 3128 Aluminum Narwhals

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

