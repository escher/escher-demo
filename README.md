escher-demo
===========

To get started, clone this repository using git, or download this [ZIP file](https://github.com/escher/escher-demo/archive/master.zip).

Then, in your favorite terminal, navigate to the folder that contains this README, and run the following command:

```shell
python -c "import SimpleHTTPServer; m = SimpleHTTPServer.SimpleHTTPRequestHandler.extensions_map; m[''] = 'text/plain'; m.update(dict([(k, v + ';charset=UTF-8') for k, v in m.items()])); SimpleHTTPServer.test();"
```

This will start a unicode-friendly Python web server. Open [http://localhost:8000/](http://localhost:8000/) to see the demos.

Try editing the `minimal_embedded_map/index.html` file, then reload your web browser to see what you've changed. You can see what's happening under the hood by opening your Developer tools ([Chrome](https://developer.chrome.com/devtools), [Firefox](https://developer.mozilla.org/en-US/docs/Tools)). Next, have a look at the Escher [JavaScript documentation](http://escher.readthedocs.org/) to learn about the Builder class and its options and methods.

Ideas
-----

- sliders for data
- knockout example
- data (e.g. plots) on hover
- embed in website
- ChemSpider structures on a map
