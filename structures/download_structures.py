#!/usr/bin/env python
# coding: utf-8

import chemspipy
import json
import os
from os.path import join, exists
import re

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

    # save the image
    with open(structure_path, 'w') as f:
        print 'Found structure for {}. Saving to {}'.format(node['name'], structure_path)
        f.write(chem.image)