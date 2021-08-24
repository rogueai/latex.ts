import {join} from 'path'
import {createTempDirectory, exec, readFile, writeFile} from './utils'
import {readErrorLog} from './readErrorLog'

export type Options = {
    texInputs?: string[]
    shellEscape?: boolean,
    outputType?: string
}

// /**
//  * Create ENV for pdflatex with TEXINPUTS correctly set
//  */
// const createChildEnv = (texInputs: string[] = []) =>
//     set(process.env, _ => _.TEXINPUTS)((TEXINPUTS = '') =>
//         [
//             // Transform relative paths in absolute paths
//             ...texInputs.map(path => resolve(process.cwd(), path)),
//             ...TEXINPUTS.split(':')
//         ]
//             // Append colon to use default paths too
//             .join(':')
//     )

const createCommand = (options: Options) =>
    [
        'pdflatex',
        ...(options.shellEscape ? ['-shell-escape'] : []),
        '-halt-on-error',
        'texput.tex'
    ].join(' ')

/**
 * Compile LaTeX source
 */
const compile = async (tempPath: string, options: Options) => {
    try {
        await exec(createCommand(options), {
            cwd: tempPath,
            // env: createChildEnv(options.texInputs)
        })
        return readFile(join(tempPath, `texput.${options.outputType || 'png'}`))
    } catch {
        throw await readErrorLog(tempPath)
    }
}

/**
 * Create PDF from a LaTeX file
 */
const pdflatex = async (source: string, options: Options = {}) => {
    const tempPath = await createTempDirectory()
    await writeFile(join(tempPath, 'texput.tex'), source)
    return compile(tempPath, options)
}

export default pdflatex