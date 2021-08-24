import fs from 'fs';
import pdflatex from './utils/pdflatex/pdflatex';

export default {
    async generateLatexImage(source: string, filename: string, width: number, height: number) {
        const content = `
       \\documentclass[preview=true,border=0.4pt,convert={size=${width}x${height},outext=.png}]{standalone}
       \\begin{document}
       ${source}
       \\end{document}
       `;
        const image = await pdflatex(content, {shellEscape: true});
        fs.writeFileSync(filename, image);
    }
}