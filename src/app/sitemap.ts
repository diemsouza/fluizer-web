import type { MetadataRoute } from "next";
import { CONTACT_PATH, LEGAL_PAGES_UPDATED_AT, SITE_URL } from "@/src/lib/constants";
import { BLOG_PATH, buildBlogPostPath, getBlogModifiedDate } from "@/src/core/blog";
import { listBlogPosts } from "@/src/services/blog-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listBlogPosts();
  const latestPostDate = posts[0]?.frontmatter.date;
  const legalUpdatedAt = new Date(LEGAL_PAGES_UPDATED_AT);

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${BLOG_PATH}`,
      ...(latestPostDate && { lastModified: new Date(latestPostDate) }),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map(({ frontmatter }) => ({
      url: `${SITE_URL}${buildBlogPostPath(frontmatter.slug)}`,
      lastModified: new Date(getBlogModifiedDate(frontmatter)),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/terms`,
      lastModified: legalUpdatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: legalUpdatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}${CONTACT_PATH}`,
      lastModified: legalUpdatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
