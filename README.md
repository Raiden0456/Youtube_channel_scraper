# YouTube Channel Data Scraper 📝

This app scrapes YouTube channel data, including:
  - Channel name.
  - Channel ID.
  - Channel age in years.
  - Total subscribers.
  - Total views.
  - Amount of uploaded videos for the specified days.
  - Total likes for the specified days.
  - Total comments for the specified days.
  - Average views per month(if specified date > 30 days). 
  - Average views per 3 month(if specified date > 90 days). 

## Prerequisites

1. Node.js (v14 or later) installed on your machine.
2. A YouTube Data API key. You can obtain one by following the instructions in the [official YouTube API documentation](https://developers.google.com/youtube/v3/getting-started).

## Setup

1. Clone this repository to your local machine:
 ```
  git clone https://github.com/Raiden0456/Youtube_channel_scraper
 ```
2. Change to the project directory:
 ```
  cd /path/to/your-project
 ```
3. Install the required dependencies:
  ```
  npm install
  ```
4. Set your YouTube Data API key as an environment variable:
  - `./your-project-root/.env`:
```
YOUTUBE_API_KEY = your_api_key
```
## Running the App

1. Build the app by entering the following command:
```
npm run build
```
2. Run the app:
```
npm run start
```
  - Alternatively you can run the app in dev mode(restarts automatically upon saving changes):
```
npm run dev
```

3. Input data:
  - The app will prompt you to enter a YouTube channel customURL(`youtube.com/@username` enter only username). Enter the channel customURL(or multiple with separator ', ') and press Enter. 
  - After that, app will ask you what amount of previous days to fetch data from, input number(0 for the whole time) and press Enter. 
  - The app will then fetch the channel(s) data and store it in a `channel_data.json` file.

4. To view the scraped data, open the `channel_data.json` file in your preferred text editor or JSON viewer.

Note: If you want to add more channels to the `channel_data.json` file, simply run the app again and enter a different channel customURL. The app will update the `channel_data.json` file with the new data without overwriting the existing data.

## Contributing

Feel free to contribute to this project by submitting issues, bug reports, or feature requests. You can also submit pull requests with your own improvements or fixes.<br>
Yeah I'm **_Suure_** I will be quick to respond to contributions 💀.
