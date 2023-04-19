import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.YOUTUBE_API_KEY;

class Average {
  async getVideoDetails(videoIds: string[]) {
    const batchSize = 50;
    const batches = Math.ceil(videoIds.length / batchSize);
    const allDetails = [];

    for (let i = 0; i < batches; i++) {
      const batchIds = videoIds.slice(i * batchSize, (i + 1) * batchSize);
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&key=${apiKey}&id=${batchIds.join(
        ","
      )}`;
      const detailsResponse = await axios.get(detailsUrl);

      // Add the current batch of details to the allDetails array
      allDetails.push(
        ...detailsResponse.data.items.map((item) => ({
          id: item.id,
          likeCount: parseInt(item.statistics.likeCount),
          uploadDate: new Date(item.snippet.publishedAt),
        }))
      );
    }

    return allDetails;
  }

  async getAverageLikes(videos, days) {
    const now = new Date();
    //Filtering videos to only include those uploaded within the last N days
    const filteredVideos = videos.filter(
      (video) =>
        (now.getTime() - video.uploadDate) / (1000 * 60 * 60 * 24) <= days
    );

    let totalLikes = 0;
    for (const video of filteredVideos) {
      totalLikes += video.likeCount;
    }

    const averageLikes =
      filteredVideos.length > 0 ? totalLikes / filteredVideos.length : 0;

    return Math.floor(averageLikes);
  }
}

export default Average;
