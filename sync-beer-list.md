# Beer List Sync — Instructions

## How It Works
1. Elliot edits the beer list in Google Sheets
2. A scheduled task runs daily at noon
3. The task reads the Google Sheet, converts it to beer-list.json
4. The website picks up the new JSON automatically

## Google Sheet Setup
1. Upload tallboy-beer-list-template.xlsx to Google Drive
2. Open it with Google Sheets (it will convert automatically)
3. Share with Elliot (edit access)
4. Share with peter@drinkkenetik.com (edit access)
5. The sheet ID is needed for the sync task (the long string in the URL between /d/ and /edit)

## Sheet Format
Columns: BEER NAME | ORIGIN | STYLE | ABV | STORY | SIZE | PRICE | CATEGORY

Category must be one of: LIGHT + BRIGHT, HOPPY, TOASTY, FRUITY

Category header rows (where ORIGIN is blank) are skipped by the sync script.

## Printing
Elliot can print directly from Google Sheets. The template is set to landscape, fit to width, with the header row frozen.
