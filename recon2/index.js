/* global escher */

escher.libs.d3_json('ReconMap-2.01.json', map => {
  const sel = escher.libs.d3_select('#root')

  window.builder = new escher.Builder( // eslint-disable-line no-new
    map,
    null,
    null,
    sel,
    {
      fill_screen: true,
      never_ask_before_quit: true,
      use_3d_transform: false,
      semantic_zoom: [
        {
          zoomLevel: 0.15,
          options: {
            hide_all_labels: true,
            hide_secondary_metabolites: true,
            show_gene_reaction_rules: false
          }
        },
        {
          zoomLevel: 0.3,
          options: {
            hide_all_labels: true,
            hide_secondary_metabolites: false,
            show_gene_reaction_rules: false
          }
        },
        {
          zoomLevel: 1,
          options: {
            hide_all_labels: false,
            hide_secondary_metabolites: false,
            show_gene_reaction_rules: false
          }
        },
        {
          zoomLevel: 1.5,
          options: {
            hide_all_labels: false,
            hide_secondary_metabolites: false,
            show_gene_reaction_rules: true
          }
        }
      ]
    }
  )
})
