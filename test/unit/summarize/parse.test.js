const { strict: assert } = require('assert');
const { strip, buildPrompt } = require('../../../src/summarize/parse');
const fs = require('fs').promises
const path = require('path')

describe('#strip', () => {
  it('should yank out html tags', async () => {
      const result = await strip(await fs.readFile(path.join(__dirname, '../../fixtures/email.01.txt'), { encoding: 'utf8' }))
      console.log(result)
      // assert.equal(result, 'foo');
  });
});
// describe('#strip', () => {
//   it('should yank out html tags', async () => {
//       const result = await strip('<p>foo</p>')
//       assert.equal(result, 'foo');
//   });

//   it('should yank tags on larger text blocks', async () => {
//     const data = await strip(await fs.readFile(path.join(__dirname, '../../fixtures/email.01.txt'), { encoding: 'utf-8' }))
//     assert.equal(data, await fs.readFile(path.join(__dirname, '../../fixtures/email.01.expected.txt'), { encoding: 'utf-8' }))
//   })
// });

// describe('#buildPrompt', () => {
//   it('should build a prompt from the passed array of text', async () => {
//     const result = await buildPrompt('foo', 'bar')
//     assert.equal(
//       result,
//       `<emails><email>foo</email><email>bar</email></emails>partition the news items in the included e-mails into sections (one of "Top Stories", "Business & Finance", "Politics & World Affairs", "Science & Technology",  "Sports & Entertainment", "In-Depth / Feature Stories", or "Etcetera / Miscellaneous"). every extracted news item must include: 1) a brief informative heading, 2) a detailed two to five sentence summary of the item (consistent with the writing style of the email), and 3) the link to its primary source in parentheses beside it. where two news items are very closely related, they should be consolidated, and summarized together, and the links for both should be included (for example, if an item in one email address a presidential cabinet choice, and an item in another email addresses that same cabinet choice, or a new one, these items should all be summarized together, and all of their links to primary sources should be included). the result should always be formatted as markdown. any items that appear to be advertisements should be removed altogether. under no circumstances should data from any external source, apart from the included emails, be used to assemble this briefing. the very last section should be a bulleted list titled "Intermediate Sources", sorted in reverse chronological order, and each list item should be a bullet hyperlink item with the text being the date each email briefing reported on, and the link being a link to the referenced online briefing. the title of the entire document should be "Smitch News: START_DATE to END_DATE", where START_DATE is the date the earliest email briefing reported on, and END_DATE is the date the latest email briefing reported on, and both dates should be in MMMM-DD format. when you are done, double-check the output to ensure that every news item is represented in the output, and if not, note the missing items at the bottom in a section titled "PS".`
//     )
//   })
// })