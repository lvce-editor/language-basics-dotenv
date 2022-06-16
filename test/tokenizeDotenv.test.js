import {
  initialLineState,
  tokenizeLine,
  TokenType,
  TokenMap,
} from '../src/tokenizeDotenv.js'

const DEBUG = true

const expectTokenize = (text, state = initialLineState.state) => {
  const lineState = {
    state,
  }
  const tokens = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const result = tokenizeLine(lines[i], lineState)
    lineState.state = result.state
    tokens.push(...result.tokens.map((token) => token.type))
    tokens.push(TokenType.NewLine)
  }
  tokens.pop()
  return {
    toEqual(...expectedTokens) {
      if (DEBUG) {
        expect(tokens.map((token) => TokenMap[token])).toEqual(
          expectedTokens.map((token) => TokenMap[token])
        )
      } else {
        expect(tokens).toEqual(expectedTokens)
      }
    },
  }
}

test('empty', () => {
  expectTokenize(``).toEqual()
})

test('decimal number', () => {
  expectTokenize(`x=1`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric
  )
})

test('float number', () => {
  expectTokenize(`x=5.3`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric
  )
})

test('scientific number', () => {
  expectTokenize(`x=1e10`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric
  )
})

test.skip('negative number', () => {
  expectTokenize(`x=-42`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric
  )
})

test('octal number', () => {
  expectTokenize(`x=057`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric
  )
})

test('hex number', () => {
  expectTokenize(`x=0x1A`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric
  )
})

test('comment', () => {
  expectTokenize(`# comment`).toEqual(TokenType.Comment, TokenType.Comment)
})

test('whitespace at start and end', () => {
  expectTokenize(' x=1 ').toEqual(
    TokenType.Whitespace,
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric,
    TokenType.Whitespace
  )
})

test('export', () => {
  expectTokenize(`export TEST=TRUE`).toEqual(
    TokenType.KeywordExport,
    TokenType.Whitespace,
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.LanguageConstant
  )
})

test('words that start with constants', () => {
  expectTokenize(`TEST = true_maybe`).toEqual(
    TokenType.VariableName,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.VariableValue
  )
})

test('variable name with underscore', () => {
  expectTokenize(`TEST_UNQUOTED=bar`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.VariableValue
  )
})

test('double quoted string', () => {
  expectTokenize(`TEST="test"`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.PunctuationString,
    TokenType.String,
    TokenType.PunctuationString
  )
})

test('single quoted string', () => {
  expectTokenize(`TEST='test'`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    // TODO should be punctuation string
    TokenType.Punctuation,
    TokenType.VariableValueString,
    TokenType.Punctuation
  )
})

test('comment after variable value', () => {
  expectTokenize(`TEST="test" # comment`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.PunctuationString,
    TokenType.String,
    TokenType.PunctuationString,
    TokenType.Whitespace,
    TokenType.Comment,
    TokenType.Comment
  )
})

// Todo VAR=some data

test('variable without value', () => {
  expectTokenize(`TEST=
`).toEqual(TokenType.VariableName, TokenType.Punctuation, TokenType.NewLine)
})

test.skip('escaped chars in double quotes string', () => {
  expectTokenize(String.raw`TEST="\n \t \t \" \' \$  \\"`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.VariableValueString,
    TokenType.Punctuation
  )
})

test.skip('escaped chars in single quotes string', () => {
  expectTokenize(String.raw`TEST='\n \t \t \" \' \$  \\'`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.VariableValueString,
    TokenType.Punctuation
  )
})

test('language constant with newline', () => {
  expectTokenize(`x=true
`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.LanguageConstant,
    TokenType.NewLine
  )
})

test('special character - ñ', () => {
  expectTokenize(`x=ñ`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.VariableValue
  )
})

test('invalid double quote', () => {
  expectTokenize(`KEY=42"`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric,
    TokenType.Error
  )
})

test('double quoted string', () => {
  expectTokenize(`KEY="42"`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.PunctuationString,
    TokenType.String,
    TokenType.PunctuationString
  )
})

test('multiple properties', () => {
  expectTokenize(`KEY=42
KEY=42`).toEqual(
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric,
    TokenType.NewLine,
    TokenType.VariableName,
    TokenType.Punctuation,
    TokenType.Numeric
  )
})
