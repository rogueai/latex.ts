import fs from 'fs';
import path from 'path';
import {HtmlGenerator} from "../src";
import {parse} from '../src/latex-grammar';
import {html} from 'js-beautify';

export default {
    runFixtures(fixture) {
        return () => {
            let fixturesDir = path.join(__dirname, 'fixtures', fixture)
            fs.readdirSync(fixturesDir).forEach((fixtureFile) => {
                let fixturePath = path.resolve(fixturesDir, fixtureFile);
                it.only(`${fixtureFile.split('.')[0].split('-').join(' ')}`, async () => {
                    let fixture = fs.readFileSync(fixturePath).toString();

                    let generator = new HtmlGenerator({hyphenate: false});
                    let r = parse(fixture, {generator: generator});
                    expect(r).toBeDefined();

                    let div = document.createElement('div');
                    div.appendChild(r.domFragment().cloneNode(true));
                    document.body.appendChild(div);

                    let actual = div.innerHTML;
                    expect(html(actual)).toMatchSnapshot();

                });

            });
        }
    }
}