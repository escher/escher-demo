function initialize_knockout() {
    // load everything
    load_builder(function(builder) {
	load_model(function(model) {
	    optimize_loop(builder, model);
	});
    });
}


function load_builder(callback) {
    // load the Builder
    d3.json('E coli core.Core metabolism.json', function(e, data) {
	if (e) console.warn(e);
	d3.text('builder-embed-1.1.2.css', function(e, css) {
	    if (e) console.warn(e);
	    var options = { menu: 'all', fill_screen: true };
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
    // initialize event listeners
    var sel = builder.selection;
    sel.selectAll('.reaction')
	.on('click', function(d) {
	    console.log(d);
	});
    var cont = builder.zoom_container;
    model = set_carbon_source(model, 'EX_glc_e', 20);
    var problem = build_problem(model);
    var result = optimize(problem);
    console.log(result.solution);
    debugger;
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

function set_carbon_source(model, reaction_id, sur) {
    for (var i = 0, l = model.reactions.length; i < l; i++) {
	if (model.reactions[i].id == reaction_id) {
	    model.reactions[i].lower_bound = -sur;
	    return model;
	}
    }
    throw new Error('Bad carbon source ' + reaction_id);
}


function build_problem(model) {
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


function optimize(problem) {
    var out = numeric.solveLP(problem.c, problem.A, problem.b);
    return out;
}
