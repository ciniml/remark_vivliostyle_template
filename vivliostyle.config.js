module.exports = {
  title: 'Wio Terminal', // populated into 'manifest.json', default to 'title' of the first entry or 'name' in 'package.json'.
  author: 'Kenta IDA', // default to 'author' in 'package.json' or undefined
  language: 'ja', // default to 'en'
  size: 'A4',
  theme: "themes/default.css", // .css or local dir or npm package. default to undefined
  entry: [ // **required field**
    'main.html'
    // 'introduction.md', // 'title' is automatically guessed from the file (frontmatter > first heading)
    // {
    //   path: 'epigraph.md',
    //   title: 'おわりに', // title can be overwritten (entry > file),
    //   theme: '@vivliostyle/theme-whatever' // theme can be set indivisually. default to root 'theme'
    // },
    // 'glossary.html' // html is also acceptable
  ], // 'entry' can be 'string' or 'object' if there's only single markdown file
  // entryContext: './manuscripts', // default to '.' (relative to 'vivliostyle.config.js')
  outFile: './output.pdf', // path to generated pdf file. cannot be used with outDir.
  // outDir: './output', // path to the directory where the generated pdf is located. filename is picked from 'title'. cannot be used with outFile.
  toc: false, // whether generate and include toc.html or not (does not affect manifest.json), default to 'false'. if 'string' given, use it as a custom toc.html.
  format: 'pdf', // reserved for future usage. default to 'pdf'.
  // distDir: './build', // default to '.vivliostyle',
};
