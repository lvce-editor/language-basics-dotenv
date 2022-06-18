import { readdir, readFile, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import { join } from 'node:path'
import {
  initialLineState,
  tokenizeLine,
  TokenMap,
} from '../src/tokenizeDotenv.js'

/**
 * @param {string} fileNameWithExtension
 */
const getFileName = (fileNameWithExtension) => {
  const fileName = path.parse(fileNameWithExtension).name
  return fileName
}
/**
 *
 * @param {string} root
 * @returns
 */
const getFiles = async (root) => {
  const casesFolder = join(root, 'test', 'cases')
  const files = await readdir(casesFolder)
  return files
}

/**
 * @param {any} token
 */
const getName = (token) => {
  return TokenMap[token.type]
}

/**
 *
 * @param {string} text
 */
const tokenizeLines = (text) => {
  const lineState = {
    state: initialLineState.state,
  }
  const tokens = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const result = tokenizeLine(lines[i], lineState)
    lineState.state = result.state
    tokens.push(...result.tokens.map(getName))
    tokens.push('NewLine')
  }
  tokens.pop()
  return tokens.join('\n')
}

/**
 *
 * @param {string} root
 * @param {string} file
 * @param {string} fileName
 */
const testFile = async (root, file, fileName) => {
  const casePath = join(root, 'test', 'cases', file)
  const caseContent = await readFile(casePath, 'utf-8')
  let generated
  try {
    generated = tokenizeLines(caseContent)
  } catch (error) {
    console.error(`tokenization failed for ${fileName}`)
    return 'failed'
  }

  const baselinePath = join(root, 'test', 'baselines', fileName + '.txt')
  let baselineContent
  try {
    baselineContent = await readFile(baselinePath, 'utf-8')
    baselineContent = baselineContent.trim()
  } catch (error) {
    // @ts-ignore
    if (error && error.code === 'ENOENT') {
      await writeFile(baselinePath, generated)
      return 'passed'
    }
  }

  if (generated !== baselineContent) {
    console.error(`mismatch ${fileName} `)
    return 'failed'
  }
  return 'passed'
}

const main = async () => {
  const root = process.cwd()
  const packageJsonPath = join(root, 'package.json')
  const packageJsonContent = await readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonContent)
  const config = packageJson['test-tokenize'] || {
    skip: [],
  }
  const start = performance.now()
  const files = await getFiles(root)
  const stats = {
    passed: 0,
    failed: 0,
    skipped: 0,
  }
  for (const file of files) {
    const fileName = getFileName(file)
    if (config.skip.includes(fileName)) {
      stats['skipped']++
    } else {
      const status = await testFile(root, file, fileName)
      stats[status]++
    }
  }
  const end = performance.now()
  const duration = end - start
  if (stats.failed) {
    console.info(`${stats.failed} tests failed, ${stats.passed} tests passed`)
  } else if (stats.skipped) {
    console.info(
      `${stats.skipped} tests skipped, ${stats.passed} tests passed in ${duration}ms`
    )
  } else {
    console.info(`${files.length} tests passed in ${duration}ms`)
  }
  console.log(performance.now())
}

main()
