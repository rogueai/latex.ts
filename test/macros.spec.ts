import {HtmlGenerator} from "../src";
import {parse} from '../src/latex-grammar';
import {generateImage} from "jsdom-screenshot";
import {toMatchImageSnapshot} from 'jest-image-snapshot';

expect.extend({toMatchImageSnapshot});

import fs from 'fs';
import path from 'path';

describe('Fixtures: Macros', () => {
  let fixturesPath = path.join(__dirname, 'fixtures', 'macros')
  fs.readdirSync(fixturesPath).forEach((fixture)=>{
    let fixturePath = path.resolve(fixturesPath, fixture);
    
    it(`Macro: '${fixture}' renders correctly`, () => {
      let fixture = fs.readFileSync(fixturePath).toString();

      let generator = new HtmlGenerator({hyphenate: false});
      let r = parse(fixture, {generator: generator});
      expect(r).toBeDefined();
      let div = document.createElement('div');
      div.appendChild(r.domFragment().cloneNode(true));
      document.body.appendChild(div);
      expect(div.innerHTML).toMatchSnapshot();

      // let screenshot = generateImage();
      // expect(screenshot).toMatchImageSnapshot({
      //   comparisonMethod: 'ssim'
      // });
    });
  });

});