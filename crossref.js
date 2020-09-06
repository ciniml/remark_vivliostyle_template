window.addEventListener('load', function () {
    var chapter = 0;
    var section = 0;
    var subsection = 0;

    // Generate reference names for each headings.
    const body = document.getElementsByTagName("body")[0];
    Array.prototype.forEach.call(body.childNodes, (element) => {
        if( element.tagName == "H1" ) {
            chapter += 1;
            element.textContent = `${chapter}. ${element.textContent}`; 
            section = 0;
            subsection = 0;
        }
        if( element.tagName == "H2" ) {
            section += 1;
            element.textContent = `${chapter}-${section}. ${element.textContent}`; 
            subsection = 0;
        }
        if( element.tagName == "H3" ) {
            subsection += 1;
            element.textContent = `${chapter}-${section}-${subsection}. ${element.textContent}`; 
        }
    });

    // Add counter for each figcaption
    {
        var figure = 1;
        var table = 1;
        var list = 1;

        const elements = document.getElementsByTagName("figcaption");
        Array.prototype.forEach.call(elements, (element) => {
            var count = null;
            var prefix = null;
            if( element.classList.contains("fig") ) {
                count = figure;
                prefix = "図";
                figure += 1;
            }
            if( element.classList.contains("tbl") ) {
                count = table;
                prefix = "表";
                table += 1;
            }
            if( element.classList.contains("lst") ) {
                count = list;
                prefix = "リスト";
                list += 1;
            }
            if( count !== null ) {
                element.textContent = `${prefix}${count}. ${element.textContent}`;
                const attr = document.createAttribute("xref_counter");
                attr.value = `${prefix}${count}`;
                element.attributes.setNamedItem(attr);
            }
        });
    }

    // Replace contents of xref anchors
    {
    const elements = document.getElementsByClassName("xref");
        Array.prototype.forEach.call(elements, (element) => {
            if( element.tagName == "A" ) {
                const hash = element.hash;
                if( hash ) {
                    const target = document.getElementById(hash.substr(1));
                    if( target ) {
                        const attr = target.attributes.getNamedItem("xref_counter");
                        if( attr ) {
                            element.textContent = attr.value;
                        }
                    }
                }
            }
        });
    }

    // Add notifier element
    const notifier = document.createElement("span");
    notifier.id = "crossref_end";
    notifier.style.display = "none";
    body.appendChild(notifier);
});