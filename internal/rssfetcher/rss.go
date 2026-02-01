package rssfetcher

import (
	"context"
	"strings"

	"github.com/mmcdole/gofeed"
	"github.com/collabreef/collabreef/internal/urlfetcher"
)

// RSSItem represents a single RSS feed item
type RSSItem struct {
	Title       string `json:"title"`
	Link        string `json:"link"`
	Description string `json:"description,omitempty"`
	PubDate     string `json:"pubDate,omitempty"`
	GUID        string `json:"guid,omitempty"`
	ImageURL    string `json:"imageUrl,omitempty"`
}

// RSSFeed represents the parsed RSS feed
type RSSFeed struct {
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Link        string    `json:"link,omitempty"`
	Items       []RSSItem `json:"items"`
}

// FetchAndParseFeed fetches an RSS/Atom feed URL and returns parsed items
func FetchAndParseFeed(ctx context.Context, feedURL string) (*RSSFeed, error) {
	// Use the existing safe URL fetcher to get the feed data
	data, _, err := urlfetcher.SafeFetchFile(ctx, feedURL)
	if err != nil {
		return nil, err
	}

	// Parse the feed using gofeed
	fp := gofeed.NewParser()
	feed, err := fp.ParseString(string(data))
	if err != nil {
		return nil, err
	}

	// Convert to our RSSFeed structure
	rssFeed := &RSSFeed{
		Title:       feed.Title,
		Description: feed.Description,
		Link:        feed.Link,
		Items:       make([]RSSItem, 0, len(feed.Items)),
	}

	for _, item := range feed.Items {
		pubDate := ""
		if item.PublishedParsed != nil {
			pubDate = item.PublishedParsed.Format("2006-01-02T15:04:05Z07:00")
		} else if item.Published != "" {
			pubDate = item.Published
		}

		// Get description, prefer Description over Content
		description := item.Description
		if description == "" && item.Content != "" {
			description = item.Content
		}

		// Strip HTML tags from description for cleaner display
		description = stripHTML(description)

		guid := item.GUID
		if guid == "" {
			guid = item.Link
		}

		// Extract image URL from various sources
		imageURL := extractImageURL(item)

		rssFeed.Items = append(rssFeed.Items, RSSItem{
			Title:       item.Title,
			Link:        item.Link,
			Description: description,
			PubDate:     pubDate,
			GUID:        guid,
			ImageURL:    imageURL,
		})
	}

	return rssFeed, nil
}

// extractImageURL extracts image URL from various RSS item sources
func extractImageURL(item *gofeed.Item) string {
	// 1. Check item.Image field (common in RSS 2.0)
	if item.Image != nil && item.Image.URL != "" {
		return item.Image.URL
	}

	// 2. Check enclosures for images (podcasts, media RSS)
	for _, enclosure := range item.Enclosures {
		if enclosure.Type != "" && strings.HasPrefix(enclosure.Type, "image/") {
			return enclosure.URL
		}
	}

	// 3. Check media:thumbnail extension (common in YouTube, media RSS)
	if item.Extensions != nil {
		if media, ok := item.Extensions["media"]; ok {
			if thumbnails, ok := media["thumbnail"]; ok && len(thumbnails) > 0 {
				if url, ok := thumbnails[0].Attrs["url"]; ok {
					return url
				}
			}
			if contents, ok := media["content"]; ok && len(contents) > 0 {
				if url, ok := contents[0].Attrs["url"]; ok {
					if mediaType, ok := contents[0].Attrs["type"]; ok && strings.HasPrefix(mediaType, "image/") {
						return url
					}
				}
			}
		}
	}

	return ""
}

// stripHTML removes HTML tags from a string (basic implementation)
func stripHTML(s string) string {
	// Simple HTML tag removal
	inTag := false
	result := strings.Builder{}
	for _, r := range s {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
			inTag = false
			continue
		}
		if !inTag {
			result.WriteRune(r)
		}
	}
	return strings.TrimSpace(result.String())
}
