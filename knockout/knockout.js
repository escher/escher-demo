function initialize_knockout() {
    // load everything
    load_builder(function(builder) {
	load_model(function(model) {
	    var old_model = escher.utils.clone(model);
	    optimize_loop(builder, model);
	    builder.selection
		.append('button')
		.style('position', 'absolute')
		.style('bottom', '10px')
		.style('right', '20px')
		.text('Reset')
		.on('click', function() {
		    model = escher.utils.clone(old_model);
		    optimize_loop(builder, model);
		});
	});
    });
}


function load_builder(callback) {
    // load the Builder
    d3.json('E coli core.Core metabolism.json', function(e, data) {
	if (e) console.warn(e);
	d3.text('builder-embed-1.1.2.css', function(e, css) {
	    if (e) console.warn(e);
	    var options = { menu: 'all',
			    fill_screen: true,
			    reaction_styles: ['abs', 'color', 'size', 'text'] };
	    var b = escher.Builder(data, null, css, d3.select('#map_container'), options);
	    callback(b);
	});
    });
}


function load_model(callback) {
    d3.json('E coli core.json', function(e, data) {
	if (e) console.warn(e);
	callback(data);
    });
}


function optimize_loop(builder, model) {
    var solve_and_display = function(m) {
	var problem = build_glpk_problem(m);
	var result = optimize(problem);
	if (result.f == 0.0) {
	    builder.set_reaction_data(null);
	    builder.map.set_status('You killed E. coli!');
	} else { 
	    builder.set_reaction_data(result.x);
	    builder.map.set_status('Objective value: ' + result.f.toFixed(3));
	}
    };

    // set up and run
    model = set_carbon_source(model, 'EX_glc_e', 20);
    solve_and_display(model);
    
    // initialize event listeners
    var sel = builder.selection;
    sel.selectAll('.reaction,.reaction-label')
	.style('cursor', 'pointer')
	.on('click', function(d) {
	    model = knock_out_reaction(model, d.bigg_id);
	    solve_and_display(model);
	});
}


function fill_array(len, val) {
    for (var i = 0, arr = new Array(len); i < len;)
	arr[i++] = val;
    return arr;
}


function fill_array_single(len, val, index_value, index) {
    for (var i = 0, arr = new Array(len); i < len;) {
	if (i == index)
	    arr[i++] = index_value;
	else 
	    arr[i++] = val;
    }
    return arr;
}


function knock_out_reaction(model, reaction_id) {
    for (var i = 0, l = model.reactions.length; i < l; i++) {
	if (model.reactions[i].id == reaction_id) {
	    model.reactions[i].lower_bound = 0.0;
	    model.reactions[i].upper_bound = 0.0;
	    return model;
	}
    }
    throw new Error('Bad reaction ' + reaction_id);
}
    

function set_carbon_source(model, reaction_id, sur) {
    for (var i = 0, l = model.reactions.length; i < l; i++) {
	if (model.reactions[i].id == reaction_id) {
	    model.reactions[i].lower_bound = -sur;
	    return model;
	}
    }
    throw new Error('Bad carbon source ' + reaction_id);
}


function build_array_problem(model) {
    /** Build a LP for the model.

     Arguments
     ---------

     model: A COBRA JSON model.

     */
    var c = [],
	A_less = [], A_greater = [], A_upper = [], A_lower = [],
	b_less = [], b_greater = [], b_upper = [], b_lower = [],
	n_rows = model.metabolites.length,
	n_cols = model.reactions.length,
	met_lookup = {};
    model.metabolites.forEach(function(metabolite, i) {
	// remember the indices of the metabolites
	met_lookup[metabolite.id] = i;
	// S*v = 0
	b_less[i] = 0;
	b_greater[i] = 0;
	// S matrix filled with zeros
	A_less[i] = fill_array(n_cols, 0);
	A_greater[i] = fill_array(n_cols, 0);
    });
    model.reactions.forEach(function(reaction, i) {
	// objective function
	c[i] = -reaction.objective_coefficient;
	// S matrix values
	for (var met_id in reaction.metabolites) {
	    A_less[met_lookup[met_id]][i] = reaction.metabolites[met_id];
	    A_greater[met_lookup[met_id]][i] = -reaction.metabolites[met_id];
	}
	// upper and lower bound constraints
	A_lower[i] = fill_array_single(n_cols, 0, -1, i);
	b_lower[i] = -reaction.lower_bound;
	A_upper[i] = fill_array_single(n_cols, 0, 1, i);
	b_upper[i] = reaction.upper_bound;
    });
    var A = A_less.concat(A_greater, A_lower, A_upper);
    var b = b_less.concat(b_greater, b_lower, b_upper);
    return {c: c, A: A, b: b};
}


function build_glpk_problem(model) {
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
    var lp = glp_create_prob();
    glp_set_prob_name(lp, 'knockout FBA');
    // maximize
    glp_set_obj_dir(lp, GLP_MAX);
    // set up rows and columns
    glp_add_rows(lp, n_rows);
    glp_add_cols(lp, n_cols);

    // metabolites
    model.metabolites.forEach(function(metabolite, i) {
	var row_ind = i + 1;
	glp_set_row_name(lp, row_ind, metabolite.id);
	glp_set_row_bnds(lp, row_ind, GLP_FX, 0.0, 0.0);
	// remember the indices of the metabolites
	met_lookup[metabolite.id] = row_ind;
    });

    // reactions
    var mat_ind = 1;
    model.reactions.forEach(function(reaction, i) {
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


function optimize(problem) {
    var smcp = new SMCP({presolve: GLP_ON});
    glp_simplex(problem, smcp);
    // get the objective
    var f = glp_get_obj_val(problem);
    // get the primal
    var x = {};
    for (var i = 1; i <= glp_get_num_cols(problem); i++){
	x[glp_get_col_name(problem, i)] = glp_get_col_prim(problem, i);
    }
    return {f: f, x: x};
}
