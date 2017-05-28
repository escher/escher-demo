/** knockout.js - run knockouts in the browser with glpk.js

 Copyright (C) 2015 The Regents of the University of California.

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>

 */

/* global escher, d3, GLP_FX, glp_set_row_bnds, glp_set_row_name, glp_add_cols,
 glp_add_rows, GLP_MAX, glp_set_obj_dir, glp_set_prob_name, glp_create_prob,
 glp_get_obj_val, glp_simplex, GLP_ON, SMCP, glp_load_matrix, glp_set_obj_coef,
 GLP_DB, glp_set_col_bnds, glp_set_col_name, glp_get_col_name, glp_get_col_prim,
 glp_get_obj_val, glp_get_num_cols */

var tooltip_style = {
 'min-width': '500px',
 'min-height': '50px',
 'border-radius': '2px',
 'border': '1px solid #b58787',
 'padding': '7px',
 'background-color': '#fff',
 'text-align': 'left',
 'font-size': '16px',
 'font-family': 'sans-serif',
 'color': '#111',
 'box-shadow': '4px 6px 20px 0px rgba(0, 0, 0, 0.4)',
}

var _ = escher.libs.underscore

function initialize_knockout () {
    // load everything
    load_builder(function(builder) {
        load_model(function(model) {
            var old_model = escher.utils.clone(model);
            optimize_loop(builder, model);
            d3.select('#reset-button').on('click', function () {
                    model = escher.utils.clone(old_model)
                    optimize_loop(builder, model)
                });
        });
    });
}


function load_builder (callback) {
    // load the Builder
    d3.json('E coli core.Core metabolism.json', function(e, data) {
        if (e) console.warn(e);
        var options = { menu: 'all',
                        use_3d_transform: true,
                        enable_editing: false,
                        fill_screen: true,
                        reaction_styles: ['abs', 'color', 'size', 'text'],
                        never_ask_before_quit: true,
                        enable_tooltips: true, }
        var b = escher.Builder(data, null, null, d3.select('#map_container'), options)
        callback(b)
    });
}


function load_model(callback) {
    d3.json('E coli core.json', function (e, data) {
        if (e) console.warn(e)
        callback(data)
    });
}


function set_knockout_status (text) {
    d3.select('#knockout-status').text(text)
}


function optimize_loop (builder, model) {
    builder.options.tooltip_component = function (args) {
      // Check if there is already text in the tooltip
      if (args.el.childNodes.length === 0) {
        // If not, add new text
        var title_node = document.createTextNode('Hello ')
        var br = document.createElement('br')
        var lower_title_node = document.createTextNode('Lower bound ')
        var upper_title_node = document.createTextNode(' Upper bound ')
        args.el.appendChild(title_node)
        args.el.appendChild(br)
        args.el.appendChild(lower_title_node)
        // var $lower_input = $('<input>').appendTo(args.el)
        args.el.appendChild(upper_title_node)
        // var $upper_input = $('<input>').appendTo(args.el)
        var $slider_input = $('<input class = "slider">').appendTo(args.el)
        var $knockout_button = document.createElement('button')
        var $rxn_reset = document.createElement('button')
        var ko_btn_text = document.createTextNode('Knockout Gene')
        var reset_btn_text = document.createTextNode('Reset Reaction')
        $knockout_button.appendChild(ko_btn_text)
        $rxn_reset.appendChild(reset_btn_text)
        $knockout_button.setAttribute('class', 'knockout_button')
        $rxn_reset.setAttribute('class', 'rxn_reset')
        args.el.appendChild($knockout_button)
        args.el.appendChild($rxn_reset)
        $slider_input.ionRangeSlider()
      // Style the text based on our tooltip_style object
        Object.keys(tooltip_style).map(function (key) {
          args.el.style[key] = tooltip_style[key]
        })
      }
      var list = [-1000]
      for (var i = -50; i <= 50; i++) {
          list.push(i)
      }
      list.push(1000)
      var $slider_input = $(args.el).children('.slider')
      var $knockout_button = $(args.el).children('.knockout_button')
      var $rxn_reset = $(args.el).children('.rxn_reset')
      var slider_data = $slider_input.data('ionRangeSlider')
      for (var i = 0, l = model.reactions.length; i < l; i++) {
          if (model.reactions[i].id == args.state.biggId) {
              var lower = model.reactions[i].lower_bound
              var upper = model.reactions[i].upper_bound
          }
      }
      console.log(upper)
      slider_data.update({
        hide_min_max: true,
        keyboard: true,
        min: -1000,
        max: 1000,
        from: lower,
        to: upper,
        from_value: lower,
        to_value: upper,
        type: 'double',
        step: 1,
        force_edges: true,
        values: list,
        onChange: _.throttle(function (data) {
          model = change_flux_reaction (model, args.state.biggId, data.from_value, data.to_value)
          solve_and_display(model, builder, knockouts)
        }, .200),
        onFinish: function (data) {
          model = change_flux_reaction (model, args.state.biggId, data.from_value, data.to_value)
          solve_and_display(model, builder, knockouts)
          console.log(data.to)
          console.log(data.to_value)
        },
      })
      $knockout_button.onclick = function() {
        if (knockable(args.el.bigg_id)) {
          if (!(args.el.bigg_id in knockouts))
            knockouts[args.el.bigg_id] = true
          model = knock_out_reaction(model, args.el.bigg_id)
          solve_and_display(model, builder, knockouts)
        }
      }
    // Update the text to read out the identifier biggId
    args.el.childNodes[0].textContent = args.state.biggId
    }
    builder.load_map(builder.map_data)
    var knockouts = {}
    var knockable = function(r) {
      return (r.indexOf('EX_') == -1
              && r.indexOf('ATPM') == -1
              && r.indexOf('Biomass') == -1)
    }

    // set up and run
    model = set_carbon_source(model, 'EX_glc_e', 20)
    solve_and_display(model, builder, knockouts)

    // initialize event listeners
    var sel = builder.selection;
    sel.selectAll('.reaction,.reaction-label')
        .style('cursor', function(d) {
            if (knockable(d.bigg_id)) return 'pointer';
            else return null;
        })
        .on('click', function(d) {
            if (knockable(d.bigg_id)) {
                if (!(d.bigg_id in knockouts))
                    knockouts[d.bigg_id] = true;
                model = knock_out_reaction(model, d.bigg_id);
                solve_and_display(model, builder, knockouts);
            }
        });
    // grey for reactions that cannot be knocked out
    sel.selectAll('.reaction-label')
        .style('fill', function(d) {
            if (!knockable(d.bigg_id)) return '#888';
            else return null;
        });
}

function solve_and_display (model, builder, knockouts) {
    var problem = build_glpk_problem(model)
    var result = optimize(problem)
    var keys = Object.keys(knockouts)
    var ko_string = keys.map(function (s) { return 'Δ'+s; }).join(' ');
    var nbs = String.fromCharCode(160); // non-breaking space
    if (keys.length > 0)
        ko_string += (' (' + keys.length + 'KO): ');
    else ko_string = 'Click a reaction to knock it out. ';
    if (result.f < 1e-3) {
        builder.set_reaction_data(null);
        set_knockout_status(ko_string + 'You killed E.' + nbs + 'coli!');
    } else {
        builder.set_reaction_data(result.x);
        set_knockout_status(ko_string + 'Growth' + nbs + 'rate:' + nbs +
                            (result.f/1.791*100).toFixed(1) + '%');
    }
}


function fill_array (len, val) {
    for (var i = 0, arr = new Array(len); i < len;)
        arr[i++] = val;
    return arr;
}


function fill_array_single (len, val, index_value, index) {
    for (var i = 0, arr = new Array(len); i < len;) {
        if (i == index)
            arr[i++] = index_value;
        else
            arr[i++] = val;
    }
    return arr;
}


function knock_out_reaction (model, reaction_id) {
    for (var i = 0, l = model.reactions.length; i < l; i++) {
        if (model.reactions[i].id == reaction_id) {
            model.reactions[i].lower_bound = 0.0
            model.reactions[i].upper_bound = 0.0
            return model;
        }
    }
    throw new Error('Bad reaction ' + reaction_id)
}


function change_flux_reaction (model, reaction_id, lower, upper) {
    for (var i = 0, l = model.reactions.length; i < l; i++) {
        if (model.reactions[i].id == reaction_id) {
            model.reactions[i].lower_bound = lower
            model.reactions[i].upper_bound = upper
            return model;
        }
    }
    throw new Error('Bad reaction ' + reaction_id)
}


function set_carbon_source(model, reaction_id, sur) {
    for (var i = 0, l = model.reactions.length; i < l; i++) {
        if (model.reactions[i].id == reaction_id) {
            model.reactions[i].lower_bound = -sur
            return model
        }
    }
    throw new Error ('Bad carbon source ' + reaction_id)
}


function build_glpk_problem (model) {
    /** Build a GLPK LP for the model.

     Arguments
     ---------

     model: A COBRA JSON model.

     */
    var n_rows = model.metabolites.length,
        n_cols = model.reactions.length,
        ia = [], ja = [], ar = [],
        met_lookup = {};

    // initialize LP objective
    var lp = glp_create_prob ();
    glp_set_prob_name (lp, 'knockout FBA');
    // maximize
    glp_set_obj_dir (lp, GLP_MAX);
    // set up rows and columns
    glp_add_rows (lp, n_rows);
    glp_add_cols (lp, n_cols);

    // metabolites
    model.metabolites.forEach (function (metabolite, i) {
        var row_ind = i + 1;
        glp_set_row_name (lp, row_ind, metabolite.id);
        glp_set_row_bnds (lp, row_ind, GLP_FX, 0.0, 0.0);
        // remember the indices of the metabolites
        met_lookup[metabolite.id] = row_ind;
    });

    // reactions
    var mat_ind = 1;
    model.reactions.forEach (function (reaction, i) {
        var col_ind = i + 1;

        glp_set_col_name(lp, col_ind, reaction.id);
        if (reaction.lower_bound == reaction.upper_bound)
            glp_set_col_bnds(lp, col_ind, GLP_FX, reaction.lower_bound, reaction.upper_bound);
        else
            glp_set_col_bnds(lp, col_ind, GLP_DB, reaction.lower_bound, reaction.upper_bound);
        glp_set_obj_coef(lp, col_ind, reaction.objective_coefficient);

        // S matrix values
        for (var met_id in reaction.metabolites) {
            ia[mat_ind] = met_lookup[met_id];
            ja[mat_ind] = col_ind;
            ar[mat_ind] = reaction.metabolites[met_id];
            mat_ind++;
        }
    });
    // Load the S matrix
    glp_load_matrix(lp, ia.length - 1, ia, ja, ar);

    return lp;
}


function optimize (problem) {
    var smcp = new SMCP({presolve: GLP_ON});
    glp_simplex (problem, smcp);
    // get the objective
    var f = glp_get_obj_val (problem);
    // get the primal
    var x = {};
    for (var i = 1; i <= glp_get_num_cols(problem); i++){
        x[glp_get_col_name(problem, i)] = glp_get_col_prim(problem, i);
    }
    return {f: f, x: x};
}

window.onload = function () {
  initialize_knockout()
}
