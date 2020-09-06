const fs = require('fs')
const unified = require('unified')
const markdown = require('remark-parse')
const crossref = require('@paperist/remark-crossref')
const footnotes = require('remark-footnotes')
const footnotesInPlace = require('dewriteful/lib/packages/remark-footnote-in-place')
//const highlight = require('remark-highlight.js')
const mermaid = require('remark-mermaid')
const prism = require('remark-prism')
const rehype = require('remark-rehype')
const raw = require('rehype-raw')
const document = require('rehype-document')
const stringify = require('rehype-stringify')
const all = require('mdast-util-to-hast/lib/all')

unified()
  .use(markdown)
  .use(crossref)
  .use(footnotes)
  .use(footnotesInPlace)
  .use(mermaid)
  .use(prism, {
    showSpotLight: true,
    plugins: [
      'prismjs/plugins/autolinker/prism-autolinker',
      'prismjs/plugins/diff-highlight/prism-diff-highlight',
      'prismjs/plugins/inline-color/prism-inline-color',
      //'prismjs/plugins/line-numbers/prism-line-numbers',
      'prismjs/plugins/treeview/prism-treeview',
      //'prismjs/plugins/show-invisibles/prism-show-invisibles',
    ]
  })
  .use(rehype, {"allowDangerousHtml": true, "handlers": {
    'heading': headingHandler, 
    'crossReference': crossReferenceHandler,
    'footnote': footnoteHandler
  }})
  .use(raw)
  .use(addReferencePlugin)
  .use(document, {"title": "hoge", "css": ['themes/default.css']})
  .use(stringify, {"allowDangerousHtml": true})
  .process(fs.readFileSync('main.md'), function(err, file) {
    if (err) throw err
    //console.log(String(file))
    fs.writeFileSync("main.html", file.contents);
  });

function visit(visitor, node, parentNode, index) {
  if (visitor(node, parentNode, index) ) {
    return;
  }
  if (!node.children) {
    return;
  }

  for( let i = 0; i < node.children.length; i++ ) {
    visit(visitor, node.children[i], node, i);
  }
}

// Handles headings and converts them to H tags.
function headingHandler(h, node) {
  const properties = {}
  var text = {"type": "text", "value": ""};
  if( node.children ) {
    node.children.forEach((child) => {
      if( child.type === "text" ) {
        text.value = child.value;
        if( !properties.id ) {
          var prefix = "";
          if( node.depth == 1 ) {
            prefix = "chap:"
          }
          if( node.depth == 2 ) {
            prefix = "sec:"
          }
          if( node.depth == 3 ) {
            prefix = "subsec:"
          }
          properties.id = encodeURIComponent(prefix + child.value);
        }
      }
      if( child.type === "crossReferenceLabel" ) {
        properties.id = child.label;
      }
    });
  }
  return h(node, 'h' + node.depth, properties, [text])
}

function crossReferenceHandler(h, node) {
  const text = {"type": "text", "value": ""};
  const properties = {
    "href": `#${node.identifiers[0]}`
  };
  return h(node, 'a', properties, [text]);
}

function footnoteHandler (h, node) {
  return h(node, 'span', { className: ['footnote'] }, all(h, node))
}

function addReferencePlugin() {
  [processTargets, processAnchor, generateToc] = createReferenceNumberGenerator();
  return function (node, vfile, done) {
    try {
      visit(processTargets, node, null, 0);
      visit(processAnchor, node, null, 0);
      generateToc(node);
      done();
    } catch (err) {
      done(err);
    }
  }
}

function createReferenceNumberGenerator() {
  var chapters = [];
  var chapter = 0;
  var section = 0;
  var subsection = 0;
  var counter_figure = 1;
  var counter_table = 1;
  var counter_list = 1;
  var targets = {};
  const processTargets = function (node) {
    if( node.type === "element" ) {
      if( node.tagName === "h1" ) {
        const newChapter = {
          'name': node.children[0].value,
          'label': "",
          'counter': "",
          'children': []
        };
        chapters.push(newChapter);
        if( node.children[0].value.startsWith('unnumbered:') ) {
          node.children[0].value = node.children[0].value.replace('unnumbered:', '');
        } else {
          chapter += 1;
          section = 0;
          subsection = 0;
          newChapter.counter = `${chapter}`;
          node.children[0].value = `${chapter}. ${node.children[0].value}`;
          if( node.properties.id ) {
            targets[node.properties.id] = `第${chapter}章`;
          }
        }
        
        newChapter.label = node.children[0].value;

        return true;
      }
      if( node.tagName === "h2" ) {
        const newSection = {
          'name': node.children[0].value,
          'counter': "",
          'label': "",
          'children': []
        };
        chapters[chapter-1].children.push(newSection);

        section += 1;
        subsection = 0;
        newSection.counter = `${chapter}-${section}`;
        node.children[0].value = `${chapter}-${section}. ${node.children[0].value}`;
        if( node.properties.id ) {
          targets[node.properties.id] = `${chapter}-${section}節`;
        }
        newSection.label = node.children[0].value;
        return true;
      }
      if( node.tagName === "h3" ) {
        const newSubsection = {
          'name': node.children[0].value,
          'label': "",
          'counter': "",
          'children': []
        };
        chapters[chapter-1].children[section-1].children.push(newSubsection);

        subsection += 1;
        newSubsection.counter = `${chapter}-${section}-${subsection}`;
        node.children[0].value = `${chapter}-${section}-${subsection}. ${node.children[0].value}`;
        if( node.properties.id ) {
          targets[node.properties.id] = `${chapter}-${section}-${subsection}節`;
        }
        newSubsection.label = node.children[0].value;
        return true;
      }
      if( node.tagName === "figcaption" && node.properties && node.properties.className ) {
        var counter = null;
        var prefix = null;
        if( node.properties.className.indexOf("fig") >= 0 ) {
          counter_figure += 1;
          counter = counter_figure;
          prefix = "図";
        }
        if( node.properties.className.indexOf("tbl") >= 0 ) {
          counter_table += 1;
          counter = counter_table;
          prefix = "表";
        }
        if( node.properties.className.indexOf("lst") >= 0 ) {
          counter_list += 1;
          counter = counter_list;
          prefix = "リスト";
        }
        if( counter !== null ) {
          node.children[0].value = `${prefix}${counter}. ${node.children[0].value}`;
          const id = node.properties['id'];
          targets[id] = `${prefix}${counter}`;
          return true;
        }
      }
    }
    return false;
  };
  const processAnchor = function (node) {
    if( node.type === "element" && node.tagName === "a" && node.properties && node.properties.href ) {
      const href = node.properties.href;
      if( href.startsWith("#") ) {
        var id = href.substr(1);
        if( id.startsWith('chap:') || id.startsWith('sec:') || id.startsWith('subsec:') ) {
          id = encodeURIComponent(id);
          node.properties.href = "#" + id;
        }
        const target = targets[id];
        if( target ) {
          const contentsNode = {
            type: "text",
            value: target
          };
          node.children = [contentsNode];
          return true;
        }
      }
    }
    return false;
  };
  const makeListNode = function(className, target, text) {
    return {'type': 'element', 'tagName': 'li', 'children': [
      {'type': 'element', 'tagName': 'a', 'properties': {'className': className, 'href': '#' + encodeURIComponent(target)}, 'children': [
        {'type': 'text', 'value': text}
      ]}
    ]};
  };
  const generateToc = function (node) {
    const children = [];
    children.push({'type': 'element', 'tagName': 'h1', 'children': [{'type': 'text', 'value': '目次'}]});
    const tocListNodes = [];
    chapters.forEach((chapter) => {
      tocListNodes.push(makeListNode(['toc_chapter'], "chap:" + chapter.name, chapter.label));
      chapter.children.forEach((section) => {
        tocListNodes.push(makeListNode(['toc_section'], "sec:" + section.name, section.label));
        section.children.forEach((subsection) => {
          tocListNodes.push(makeListNode(['toc_subsection'], "subsec:" + subsection.name, subsection.label));
        });
      });
    });
    children.push({'type': 'element', 'tagName': 'ul', 'properties': {'className': ['toc']}, 'children': tocListNodes});
    // Add existing element.
    node.children.forEach((element) => {
      children.push(element);
    });
    node.children = children;
  };
  return [processTargets, processAnchor, generateToc];
}
