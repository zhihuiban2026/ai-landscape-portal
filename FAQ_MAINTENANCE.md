# FAQ Maintenance Rule

This project collects user feedback in `feedback.json` and public FAQ entries in `faq.json`.

## When is the feedback database "large enough"?

Start a FAQ review when any of these conditions are true:

1. Any feedback type reaches **3 or more entries**.
2. Similar questions appear from **2 or more different users**.
3. Total new feedback since the last FAQ review reaches **10 entries**.

## What to do during review

1. Read `feedback.json`.
2. Group repeated or similar questions.
3. Identify FAQ candidates.
4. Update `faq.json` with clear Q&A entries.
5. Keep original `feedback.json` entries for audit.
6. Notify the Discord channel with a short summary of what was added or changed.

## Low-cost policy

Do not use paid AI API for every feedback entry. Prefer rule-based grouping first. Use AI summarization only when there are enough entries to justify it.
