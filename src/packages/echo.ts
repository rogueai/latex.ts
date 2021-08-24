export  class Echo {

  args = {};

  constructor(generator, options) {
    this.args = {
      'gobbleO': ['H', 'o?'],
      'echoO': ['H', 'o?'],
      'echoOGO': ['H', 'o?', 'g', 'o?'],
      'echoGOG': ['H', 'g', 'o?', 'g']
    }
  }

  gobbleO(){
    return [];
  }
  
  echoO(o){
    return ["-", o, "-"];
  }
  
  echoOGO(o1, g, o2){
    let x$ = [];
    if (o1) {
      x$.push("-", o1, "-");
    }
    x$.push("+", g, "+");
    if (o2) {
      x$.push("-", o2, "-");
    }
    return x$;
  }
  echoGOG(g1, o, g2){
    let x$ = ["+", g1, "+"];
    if (o) {
      x$.push("-", o, "-");
    }
    x$.push("+", g2, "+");
    return x$;
  }
}
  