import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const generations = sqliteTable('generations', {
  id: text('id').primaryKey(),
  theme: text('theme').notNull(),
  videoType: text('video_type').notNull(),
  suggestedTitles: text('suggested_titles'),
  selectedTitle: text('selected_title'),
  script: text('script'),
  assetsJson: text('assets_json'),
  ttsPath: text('tts_path'),
  subtitlePath: text('subtitle_path'),
  videoPath: text('video_path'),
  thumbnailsJson: text('thumbnails_json'),
  tags: text('tags'),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  error: text('error'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: text('level').notNull(),
  message: text('message').notNull(),
  source: text('source').notNull(),
  contextJson: text('context_json'),
  createdAt: integer('created_at').notNull(),
})
