import axios from 'axios';

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

export interface RSSFeed {
  title: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}

export const fetchRSSFeed = async (feedUrl: string): Promise<RSSFeed> => {
  const response = await axios.get(`/api/v1/tools/fetch-rss`, {
    params: { url: feedUrl },
  });
  return response.data;
};
