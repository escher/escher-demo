/* global d3, escher */

window.onload = function() {

    // Load a JSON file for the map from the network
    d3.json('e_coli_core.Core metabolism.json', function(e, data) {
        if (e) console.warn(e);

        // Load the required CSS file as text
        d3.text('builder-embed-1.3.0.css', function(e, css) {
            if (e) console.warn(e);

            // ---------------------------------------
            // First map: Just show the map
            // ---------------------------------------

            var options1 = {
                /* just show the zoom buttons */
                menu: 'zoom',
                /* no editing in this map */
                enable_editing: false,
                /* no keyboard shortcuts */
                enable_keys: false
            };

            escher.Builder(data, null, css, d3.select('#map_container_1'), options1);

            // ---------------------------------------
            // Second map: Zoom in on a reaction
            // ---------------------------------------

            var my_reaction_id = '1576701',
                my_container2 = d3.select('#map_container_2');

            var options2 = {
                // just show the zoom buttons
                menu: 'zoom',
                // no editing in this map
                enable_editing: false,
                // no keyboard shortcuts
                enable_keys: false,
                // highlight the reaction specified by this id (all Escher IDs
                // are strings)
                zoom_to_element: {type: 'reaction', id: my_reaction_id },
                // do not use the d3 transforms for this map
                use_3d_transform: false,
                // This is a trick to change the behavior of the "extent"
                // button so it zooms in on the chosen reaction.
                first_load_callback: function () {
                    var builder = this;
                    my_container2
                        .selectAll('.simple-button')
                        .each(function() {
                            var t = d3.select(this);
                            // just get the canvas button
                            if (t.attr('title').indexOf('canvas') != -1) {
                                // clear other click listeners
                                t.on('click', null);
                                // go to the reaction
                                t.on('click', function() {
                                    builder.map.zoom_to_reaction(my_reaction_id);
                                });
                            }
                        });
                }
            };
            var b2 = escher.Builder(data, null, css, my_container2, options2);

            // ---------------------------------------
            // Third map: Draw a reaction from scratch
            // ---------------------------------------

            // To draw just one reaction, we can define a model for a reaction
            // with the necessary reactions, metabolites, and genes.
            var custom_model = {
                reactions: [
                    {"id": "ENO",
                     "name": "enolase",
                     "upper_bound": 1000.0,
                     "lower_bound": -1000.0,
                     "metabolites": {"pep_c": 1.0, "h2o_c": 1.0, "2pg_c": -1.0},
                     "gene_reaction_rule": "b2779"}
                ],
                metabolites: [
                    {name: "Phosphoenolpyruvate", id: "pep_c"},
                    {name: "D-Glycerate 2-phosphate", id: "2pg_c"},
                    {name: "H2O", id: "h2o_c"}
                ],
                genes: [
                    {name: "nuoK", id: "b2279"}
                ]
            };

            // set a callback to run when the Builder is ready
            var first_load_callback = function() {
                // Get a nice starting location for the reaction
                var size = this.zoom_container.get_size();
                var start_coords = { x: 100,
                                     y: -80 };
                var start_direction = 90;

                // Draw the reaction
                this.map.new_reaction_from_scratch('ENO', start_coords, start_direction);

                // And zoom the map to focus on that reaction
                this.map.zoom_extent_nodes();

                // After building a reaction, Escher selects the newest
                // metabolite. Unselect it like this.
                this.map.select_none();
            };

            // Set up the Builder
            var options3 = {
                // just show the zoom buttons
                menu: 'zoom',
                // no editing in this map
                enable_editing: false,
                // no keyboard shortcuts
                enable_keys: false,
                // show the descriptive names
                identifiers_on_map: 'name',
                // The callback
                first_load_callback: first_load_callback
            };
            escher.Builder(null, custom_model, css, d3.select('#map_container_3'), options3);
        });
    });

};
