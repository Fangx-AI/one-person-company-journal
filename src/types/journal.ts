export interface JournalEntry {
  day: number | string
  title: string
  summary: string
  content: string
  tags: string[]
  cover?: string
  images?: string[]
  slug?: string
}

export interface ResolvedJournalEntry extends JournalEntry {
  slug: string
}

/**
 * Lightweight metadata for the journal list page. Generated from the master
 * journal-entries.json by `scripts/build-journal-index.mjs` and shipped as
 * `public/data/journal-index.json`. Stays small (~50 bytes/entry) so the list
 * page never has to download every word of every post.
 */
export interface JournalIndexEntry {
  day: number | string
  title: string
  /**
   * Cleaned, listing-ready title with WeChat boilerplate stripped (see
   * `scripts/build-journal-index.mjs`). Optional so legacy index files
   * without this field still parse — components fall back to a runtime
   * cleanup of `title` in that case.
   */
  displayTitle?: string
  summary: string
  slug: string
  tags: string[]
  cover: string
}
