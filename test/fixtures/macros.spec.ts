import {HtmlGenerator} from "../../src";
import { parse, SyntaxError } from '../../src/latex-grammar';
// import b from 'js-beautify';

describe("Fixtures suite", () => {
  it('renders correctly', () => {
    let fixture = `some text \empty\ inside.`
    let generator = new HtmlGenerator({hyphenate: false});
    let r = parse(fixture, {generator: generator});
    expect(r).toBeDefined();
    let div = document.createElement('div');
    div.appendChild(r.domFragment().cloneNode(true));
    expect(div.innerHTML).toMatchSnapshot();
  });

  it('renders math correctly', () => {
    let fixture = `A basic parabola is $y = x^2$. More text afterwards.`
    let generator = new HtmlGenerator({hyphenate: false});
    let r = parse(fixture, {generator: generator});
    expect(r).toBeDefined();
    let div = document.createElement('div');
    div.appendChild(r.domFragment().cloneNode(true));
    expect(div.innerHTML).toMatchSnapshot();
  });
});