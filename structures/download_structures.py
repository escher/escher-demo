#!/usr/bin/env python
# coding: utf-8

"""download_structures.py - Download metabolite structures from ChemSpider.

The MIT License (MIT)

This software is Copyright © 2015 The Regents of the University of
California. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

"""

import chemspipy
import json
import os
from os.path import join, exists
import re
from base64 import b64decode
from StringIO import StringIO
from PIL import Image

# a useful function
def remove_compartment(met_id):
    return re.sub('_[a-z][a-z0-9]?$', '', met_id)

# make the structures directory
structures_dir = 'structure_imgs'
try:
    os.makedirs(structures_dir)
except OSError:
    pass

# get all metabolites in the map
with open('E coli core.core metabolism.json', 'r') as f:
    core_map = json.load(f)

# only look at primary metabolites
nodes = {k: node for k, node in core_map[1]['nodes'].iteritems()
         if node['node_type'] == 'metabolite' and node['node_is_primary'] is True}
print 'searching for {} structures'.format(len(nodes))

for k, node in nodes.iteritems():
    # check for img
    structure_path = join(structures_dir, '{}.png'.format(remove_compartment(node['bigg_id'])))
    if exists(structure_path):
        print 'Structure image already downloaded: {}'.format(structure_path)
        continue

    # search for the formula
    chem = chemspipy.find_one(node['name'])
    if not chem:
        print 'could not find match for {}'.format(node['name'])
        continue

    # convert to transparent
    image = Image.open(StringIO(b64decode(chem.image)))
    image = image.convert('RGBA')
    new_data = [x if x[:3] != (255, 255, 255) else (255, 255, 255, 0) for x in image.getdata()]
    image.putdata(new_data)

    # save the image
    print 'Found structure for {}. Saving to {}'.format(node['name'], structure_path)
    image.save(structure_path, "PNG")
