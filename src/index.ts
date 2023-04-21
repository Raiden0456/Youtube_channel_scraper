import axios from "axios";
import readline from "readline";
import dotenv from "dotenv";
import Average from "./utils/average.js";
import { writeDataToFile } from "./utils/writeFile.js";
dotenv.config();

const apiKey = process.env.YOUTUBE_API_KEY;

async function getVideoIds(
  channelId: string,
  days: number,
  nextPageToken?: string
): Promise<string[]> {
  const now = new Date();
  const publishedAfter = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const videoUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channelId}&key=${apiKey}&maxResults=50&publishedAfter=${publishedAfter}${
    nextPageToken ? "&pageToken=" + nextPageToken : ""
  }`;
  const videoResponse = await axios.get(videoUrl);

  console.log("Loading videos...")

  // Returning an array containing only video IDs
  const videoIds = videoResponse.data.items.map((item) => item.id.videoId);

  // If there is a next page, recursively call this function
  if (videoResponse.data.nextPageToken) {
    const nextPageVideoIds = await getVideoIds(
      channelId,
      days,
      videoResponse.data.nextPageToken
    );
    return videoIds.concat(nextPageVideoIds);
  } else {
    return videoIds;
  }
}


// Get video statistics in batches of 50
async function getVideoStatistics(videoIds: string[]) {
  const batchSize = 50;
  const batches = Math.ceil(videoIds.length / batchSize);
  const allStats = [];

  for (let i = 0; i < batches; i++) {
    const batchIds = videoIds.slice(i * batchSize, (i + 1) * batchSize);
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&key=${apiKey}&id=${batchIds.join(
      ","
    )}`;
    const statsResponse = await axios.get(statsUrl);

    // Add the current batch of statistics to the allStats array
    allStats.push(...statsResponse.data.items.map((item) => item.statistics));
  }

  return allStats;
}

// Scrape channel data main function
async function getChannelData(channelId: string, days: number) {
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`;
  const channelResponse = await axios.get(channelUrl);
  const channel = channelResponse.data.items[0];

  const average = new Average();
  const channelAgeDenor =
    (Date.now() - new Date(channel.snippet.publishedAt).getTime()) /
    (1000 * 60 * 60 * 24 * 365);
  const channelAge = Math.round(channelAgeDenor);
  const totalSubscribers = parseInt(channel.statistics.subscriberCount);
  const totalViews = parseInt(channel.statistics.viewCount);
  const channelName = channel.snippet.title;

  const videoIds = await getVideoIds(channelId, days);
  const amountOfVideosPerUserInput = videoIds.length;
  const videoStats = await getVideoStatistics(videoIds);

  const videos = await average.getVideoDetails(videoIds);
  const averageViews90 = (days >= 90) ? await average.getAverageViews(videos, 90) : "Specified days is less than 90";
  const averageViews30 = (days >=30) ? await average.getAverageViews(videos, 30): "Specified days is less than 30";

  const totalLikesPerUserInput = videoStats.reduce((total, stats) => {
    const likeCount = parseInt(stats.likeCount);
    // If likeCount is not a number, return the total without adding it
    return total + (Number.isFinite(likeCount) ? likeCount : 0);
  }, 0);

  const channelData = {
    channelName,
    channelId,
    channelAge,
    totalSubscribers,
    totalViews,
    dataPeriod: {
      days,
      videoAmount: amountOfVideosPerUserInput,
      likes: totalLikesPerUserInput,
    },
    averageViewsPerMonth: averageViews30,
    averageViewsPer3Months: averageViews90,
  };
  console.log(channelData.channelName + ": data scraped");
  return channelData;
}

// Fetch data for multiple channels
async function fetchMultipleChannels(channelIds: string[], years: number) {
  try {
    // Map each channel ID to a promise that resolves to channel data
    const channelDataPromises = channelIds.map((id) =>
      getChannelData(id, years)
    );
    const allChannelData = await Promise.all(channelDataPromises);

    for (const channelData of allChannelData) {
      await writeDataToFile(channelData.channelName, channelData);
    }
    console.log("Scraped data located in channel_data.json file.");
  } catch (error) {
    console.error("Error fetching channel data:", error);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Enter the channel ID(you can input multiple channels with separator ', '): ",
  (channelId: string) => {
    rl.question(
      "Enter the number of days to fetch data for: ",
      (days: string) => {
        const days_int = parseInt(days);

        if (channelId.includes(", ")) {
          const channelIds = channelId.split(", ");
          fetchMultipleChannels(channelIds, days_int);
        } else {
          getChannelData(channelId, days_int).then((channelData) => {
            writeDataToFile(channelData.channelName, channelData);
            console.log("Scraped data located in channel_data.json file.");
          });
        }

        rl.close();
      }
    );
  }
);
