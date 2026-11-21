export interface HelpSection {
  id: string;
  title: string;
  render: (ctx: { base: string; mcpUrl: string }) => string;
}

export interface HelpCategory {
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  badge: string;
  summary: string;
  readTime: string;
  topics: string[];
  keywords: string;
  sections: HelpSection[];
}
