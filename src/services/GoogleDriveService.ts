import { google } from "googleapis";


export function getDriveInstance(){
    const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // redirect_uri (same one used in Playground)
    );

    if (!process.env.REFRESH_TOKEN) {
    throw new Error("Missing REFRESH_TOKEN in environment variables");
    }

    // Set credentials using your refresh token
    oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN as string });

    // Initialize Drive API client
    return google.drive({ version: "v3", auth: oauth2Client });
}