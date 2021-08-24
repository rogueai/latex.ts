import fs from 'fs';
import { subClass } from 'gm';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { generateImage, setDefaultOptions } from "jsdom-screenshot";
import path from 'path';
import { HtmlGenerator } from "../src";
import { parse } from '../src/latex-grammar';

const {PNG} = require('pngjs');


const gm = subClass({imageMagick: true});

setDefaultOptions({
  launch: {
    // devtools: true,
    // headless: false,
    // slowMo: 500,
    dumpio: false,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
  }
});

expect.extend({toMatchImageSnapshot});


describe('E2E: Macros', () => {
  let fixturesDir = path.join(__dirname, 'fixtures', 'macros')
  fs.readdirSync(fixturesDir).forEach((fixtureFile) => {
    let fixturePath = path.resolve(fixturesDir, fixtureFile);

    it(`Macro: (Screenshot) '${fixtureFile}' renders correctly`, async done => {
      let imageName = `macros-${fixtureFile}`
      let customSnapshotIdentifier = (parameters) => {
        return imageName;
      }

      let fixture = fs.readFileSync(fixturePath).toString();


      let generator = new HtmlGenerator({hyphenate: false});
      parse(fixture, {generator: generator});
      let style = document.createElement("style");
      style.innerHTML = `
      .body { border: .4px solid; height: max-content; }
      `;
      document.head.appendChild(generator.stylesAndScripts());
      // document.body.appendChild(generator.domFragment());
      generator.applyLengthsAndGeometryToDom(document.documentElement);
      document.head.appendChild(style);
      let screenshot = await generateImage({
        screenshot: {
          omitBackground: true
        },
        viewport: {
          width: 1000,
          height: 0,
          deviceScaleFactor: 2
        },
        // @ts-ignore
        // targetSelector: ".body",
        serve: [
          'src/'
        ]
      });
      gm(<Buffer>screenshot, 'image.jpg')
          // .trim()
          .toBuffer('PNG', async (err, trimmed) => {
            let {width, height} = PNG.sync.read(trimmed);
            // await utils.generateLatexImage(fixture, path.join(__dirname, '__image_snapshots__', `${imageName}-snap.png`), width, height);
            expect(trimmed).toMatchImageSnapshot({
              // comparisonMethod: 'ssim',
              // allowSizeMismatch: true,
              customSnapshotIdentifier: customSnapshotIdentifier
            });
            done()
          });
    });
  });


});
