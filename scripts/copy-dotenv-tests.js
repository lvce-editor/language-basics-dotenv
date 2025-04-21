import { execaCommand } from 'execa'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/motdotla/dotenv'
const COMMIT = 'e2586db955cba6268dab0ed867b693cfe3ff5b34'

const getTestName = (line) => {
  return (
    'dotenv' +
    line
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replaceAll('.env-', '-')
      .replaceAll('.env.', '.')
  )
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (!dirent.startsWith('.env')) {
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
  await execaCommand(`git clone ${REPO} .tmp/dotenv`)
  process.chdir(`${root}/.tmp/dotenv`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  await cp(`${root}/.tmp/dotenv/tests`, `${root}/.tmp/dotenv-tests`, {
    recursive: true,
  })
  const allTests = await getAllTests(`${root}/.tmp/dotenv-tests`)
  await writeTestFiles(allTests)
}

main()
