import { execaCommand } from 'execa'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/vlucas/phpdotenv'
const COMMIT = '334f4952967f3ee6cdb2004e05e0bd01b525d56b'

const getTestName = (line) => {
  return (
    'php-dotenv-' +
    line
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replaceAll('.env-', '-')
      .replaceAll('.env.', '.')
      .replaceAll('.env', '')
      .replaceAll('tests-fixtures-env-', '')
  )
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  // console.log({ dirents })
  const allTests = []
  for (const dirent of dirents) {
    if (!dirent.endsWith('.env')) {
      continue
    }
    const filePath = `${folder}/${dirent}`
    const testName = getTestName(dirent)
    const fileContent = await readFile(filePath, 'utf8')
    allTests.push({
      testName,
      testContent: fileContent,
    })
  }
  return allTests
}

const writeTestFiles = async (allTests) => {
  for (const test of allTests) {
    await writeFile(`${root}/test/cases/${test.testName}.env`, test.testContent)
  }
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPO} .tmp/php-dotenv`)
  process.chdir(`${root}/.tmp/php-dotenv`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  const allTests = await getAllTests(`${root}/.tmp/php-dotenv`)
  await writeTestFiles(allTests)
}

main()
