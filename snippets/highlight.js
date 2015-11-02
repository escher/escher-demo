/* global d3 */

/** Find all metabolites with the same ID as the selected metabolite(s), and
 * turn them red.
 *
 * To use this snippet, paste the following code into the Console in the
 * Developer Tools for an open Escher map.
 */

d3.select('body').on('mouseup', function() {
    setTimeout(function() {
        var selected_ids = [];
        d3.selectAll('.node.selected').each(function (d) {
            selected_ids.push(d.bigg_id);
        });
        d3.selectAll('.metabolite-circle').style('fill', function(d) {
            return selected_ids.indexOf(d.bigg_id) !== -1 ? 'red' : null;
        });
    }, 200);
});
