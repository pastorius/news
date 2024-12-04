const quotedPrintable = require('quoted-printable')
const TurndownService = require('turndown')

module.exports.htmlBodyFromMultipart = async function (text) {
  const lines = text.split('\r\n')
  const marker = lines[lines.length - 2].match(/--([a-zA-Z-\d]+)--/)[1]
  const parts = text.split(`--${marker}`)
  return quotedPrintable.decode(parts[parts.length - 2]).toString('utf8')
}

module.exports.toMarkdown = async function (htmlFragment) {
  return new TurndownService().turndown(htmlFragment.replaceAll('â', "&apos;").replaceAll('Â', ''))
}

module.exports.buildPrompt = async function (...text) {
  const htmlFragments = await Promise.all(text.map(f => module.exports.htmlBodyFromMultipart(f)))
  const markdownFragments = await Promise.all(htmlFragments.map(f => module.exports.toMarkdown(f)))
  const xmlFragments = markdownFragments.map(val => `<email>${val}</email>`).join('')
  return `<emails>${fragments}</emails>partition the news items in the included e-mails into sections (one of "Top Stories", "Business & Finance", "Politics & World Affairs", "Science & Technology",  "Sports & Entertainment", "In-Depth / Feature Stories", or "Etcetera / Miscellaneous"). every extracted news item must include: 1) a brief informative heading, 2) a detailed two to five sentence summary of the item (consistent with the writing style of the email), and 3) the link to its primary source in parentheses beside it. where two news items are very closely related, they should be consolidated, and summarized together, and the links for both should be included (for example, if an item in one email address a presidential cabinet choice, and an item in another email addresses that same cabinet choice, or a new one, these items should all be summarized together, and all of their links to primary sources should be included). the result should always be formatted as markdown. any items that appear to be advertisements should be removed altogether. under no circumstances should data from any external source, apart from the included emails, be used to assemble this briefing. the very last section should be a bulleted list titled "Intermediate Sources", sorted in reverse chronological order, and each list item should be a bullet hyperlink item with the text being the date each email briefing reported on, and the link being a link to the referenced online briefing. the title of the entire document should be "Smitch News: START_DATE to END_DATE", where START_DATE is the date the earliest email briefing reported on, and END_DATE is the date the latest email briefing reported on, and both dates should be in MMMM-DD format. when you are done, double-check the output to ensure that every news item is represented in the output, and if not, note the missing items at the bottom in a section titled "PS". Finally, NEVER refer to yourself, or add any introductory text to the response.`
}