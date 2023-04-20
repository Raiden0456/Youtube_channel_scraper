import axios from "axios";
import fs from "fs";
import readline from "readline";
import dotenv from "dotenv";
import { delay } from "./utils/delay.js";
import Average from "./utils/average.js";
import { writeDataToFile } from "./utils/writeFile.js";
dotenv.config();

const apiKey = process.env.YOUTUBE_API_KEY;

// Get all video IDs in a playlist
async function getVideoIds(playlistId: string, nextPageToken?: string) {
  const videoUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${
    nextPageToken ? "&pageToken=" + nextPageToken : ""
  }`;
  const videoResponse = await axios.get(videoUrl);

  //Returning an array containing only video IDs
  const videoIds = videoResponse.data.items.map(
    (item) => item.contentDetails.videoId
  );

  //If there is a next page, recursively call this function
  if (videoResponse.data.nextPageToken) {
    //await delay(1000);
    const nextPageVideoIds = await getVideoIds(
      playlistId,
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
async function getChannelData(channelId: string) {
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`;
  const channelResponse = await axios.get(channelUrl);
  const channel = channelResponse.data.items[0];

  const average = new Average();
  const channelAgeDenor =
    (Date.now() - new Date(channel.snippet.publishedAt).getTime()) /
    (1000 * 60 * 60 * 24 * 365);
  const channelAge = Math.round(channelAgeDenor);
  const totalSubscribers = parseInt(channel.statistics.subscriberCount);
  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
  const channelName = channel.snippet.title;

  const videoIds = await getVideoIds(uploadsPlaylistId);
  const videoStats = await getVideoStatistics(videoIds);

  const videos = await average.getVideoDetails(videoIds);
  const averageLikes360 = await average.getAverageLikes(videos, 360);
  const averageLikes90 = await average.getAverageLikes(videos, 90);
  const averageLikes30 = await average.getAverageLikes(videos, 30);

  const totalLikes = videoStats.reduce((total, stats) => {
    const likeCount = parseInt(stats.likeCount);
    // If likeCount is not a number, return the total without adding it
    return total + (Number.isFinite(likeCount) ? likeCount : 0);
  }, 0);

  const channelData = {
    channelAge,
    totalSubscribers,
    totalLikes,
    averageLikes360,
    averageLikes90,
    averageLikes30,
  };

  writeDataToFile(channelName, channelData);
  console.log("Channel data saved to channel_data.json");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Enter the channel ID(you can input multiple channels with separator ', '): ",
  (channelId: string) => {
    if (channelId.includes(", ")) {
      const channelIds = channelId.split(", ");
      channelIds.forEach(async (channelId) => {
        await getChannelData(channelId);
      });
    } else {
      getChannelData(channelId);
    }
    rl.close();
  }
);
