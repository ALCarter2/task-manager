import { sanitizeTitle, plainText } from './sanitize'

describe('sanitizeTitle', () => {
  describe('plain text', () => {
    it('passes through unchanged', () => {
      expect(sanitizeTitle('Buy groceries')).toBe('Buy groceries')
    })

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeTitle('  hello  ')).toBe('hello')
    })

    it('returns empty string for empty input', () => {
      expect(sanitizeTitle('')).toBe('')
    })
  })

  describe('allowed tags', () => {
    it('preserves <strong>', () => {
      expect(sanitizeTitle('<strong>important</strong> task')).toBe('<strong>important</strong> task')
    })

    it('preserves <em>', () => {
      expect(sanitizeTitle('a <em>very</em> important thing')).toBe('a <em>very</em> important thing')
    })

    it('preserves <u>', () => {
      expect(sanitizeTitle('<u>underlined</u>')).toBe('<u>underlined</u>')
    })

    it('preserves multiple formats in one string', () => {
      expect(sanitizeTitle('<strong>bold</strong> and <em>italic</em>')).toBe(
        '<strong>bold</strong> and <em>italic</em>'
      )
    })
  })

  describe('tag normalisation', () => {
    it('normalises <b> to <strong>', () => {
      expect(sanitizeTitle('<b>bold</b>')).toBe('<strong>bold</strong>')
    })

    it('normalises <i> to <em>', () => {
      expect(sanitizeTitle('<i>italic</i>')).toBe('<em>italic</em>')
    })

    it('normalises <b> with attributes to clean <strong>', () => {
      expect(sanitizeTitle('<b style="font-weight:bold">text</b>')).toBe('<strong>text</strong>')
    })

    it('normalises <i> with attributes to clean <em>', () => {
      expect(sanitizeTitle('<i class="foo">text</i>')).toBe('<em>text</em>')
    })
  })

  describe('attribute stripping', () => {
    it('strips onclick from <strong>', () => {
      expect(sanitizeTitle('<strong onclick="evil()">text</strong>')).toBe('<strong>text</strong>')
    })

    it('strips style and class from <em>', () => {
      expect(sanitizeTitle('<em class="foo" style="color:red">text</em>')).toBe('<em>text</em>')
    })

    it('strips all attributes from <u>', () => {
      expect(sanitizeTitle('<u data-x="y">text</u>')).toBe('<u>text</u>')
    })
  })

  describe('XSS / disallowed tags', () => {
    it('strips <script> tags entirely', () => {
      expect(sanitizeTitle('<script>alert("xss")</script>text')).toBe('text')
    })

    it('strips <img> tags', () => {
      expect(sanitizeTitle('text<img src="x" onerror="evil()">more')).toBe('textmore')
    })

    it('strips <a> tags but keeps their inner text', () => {
      expect(sanitizeTitle('<a href="https://evil.com">click me</a>')).toBe('click me')
    })

    it('strips <div> wrappers but keeps inner text', () => {
      expect(sanitizeTitle('<div>wrapped text</div>')).toBe('wrapped text')
    })

    it('strips <span> wrappers but keeps inner text', () => {
      expect(sanitizeTitle('<span>hello</span>')).toBe('hello')
    })
  })
})

describe('plainText', () => {
  it('returns plain text unchanged', () => {
    expect(plainText('hello world')).toBe('hello world')
  })

  it('strips all HTML tags', () => {
    expect(plainText('<strong>bold</strong> and <em>italic</em>')).toBe('bold and italic')
  })

  it('handles nested tags', () => {
    expect(plainText('<div><strong>nested</strong></div>')).toBe('nested')
  })

  it('trims surrounding whitespace', () => {
    expect(plainText('  hello  ')).toBe('hello')
  })

  it('returns empty string for empty input', () => {
    expect(plainText('')).toBe('')
  })

  it('returns empty string for tags-only input', () => {
    expect(plainText('<strong></strong>')).toBe('')
  })
})
