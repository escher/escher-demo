/* global d3, escher */

var tinier = escher.libs.tinier
var tooltip_style = {
  'min-width': '40px',
  'min-height': '10px',
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

// --------------------------------------------------
// TOOLTIP 1: Function in plain JavaScript
// --------------------------------------------------

var tooltips_1 = function (args) {
  // Check if there is already text in the tooltip
  if (args.el.childNodes.length === 0) {
    // If not, add new text
    var node = document.createTextNode('Hello ')
    args.el.appendChild(node)
    // Style the text based on our tooltip_style object
    Object.keys(tooltip_style).map(function (key) {
      args.el.style[key] = tooltip_style[key]
    })
  }
  // Update the text to read out the identifier biggId
  args.el.childNodes[0].textContent = 'Hello ' + args.state.biggId
}

// --------------------------------------------------
// TOOLTIP 2: Callback function with Tinier for rendering
// --------------------------------------------------

var tooltips_2 = function (args) {
  // Use the tinier.render function to render any changes each time the
  // tooltip gets called
  tinier.render(
    args.el,
    // Create a new div element inside args.el
    tinier.createElement(
      'div',
      // Style the text based on our tooltip_style object
      { style: tooltip_style},
      // Update the text to read out the identifier biggId
      'Hello tinier ' + args.state.biggId
    )
  )
}

// --------------------------------------------------
// TOOLTIP 3: Tooltip with random pics
// --------------------------------------------------

var tooltips_3 = function (args) {
  // Use the tinier.render function to render any changes each time the
  // tooltip gets called
  tinier.render(
    args.el,
    // Create a new div element inside args.el
    tinier.createElement(
      'div',
      // Style the text based on our tooltip_style object
      { style: tooltip_style},
      // Update the text to read out the identifier biggId
      'Hello tinier ' + args.state.biggId,
      // Line break
      tinier.createElement('br'),
      // Add a picture
      tinier.createElement(
        'img',
        // Get a random pic from unsplash, with ID between 0 and 1000
        { src: 'https://unsplash.it/100/100?image=' +  Math.floor(Math.random() * 1000) }
      )
    )
  )
}

// --------------------------------------------------
// TOOLTIP 4: Tooltip with a D3 plot
// --------------------------------------------------

/**
 * Function to calculate the frequency of letters in a word.
 */
function calculateLetterFrequency (s) {
  var counts = {}
  s.toUpperCase().split('').map(function (c) {
    if (!(c in counts)) {
      counts[c] = 1
    } else {
      counts[c] += 1
    }
  })
  return Object.keys(counts).map(function (k) {
    return { letter: k, frequency: counts[k] }
  })
}

/**
 * Tooltip function that shows plots with the frequency of letters in each ID.
 */
var tooltips_4 = function (args) {
  // Use the tinier.render function to render any changes each time the
  // tooltip gets called
  tinier.render(
    args.el,
    // Create a new div element inside args.el
    tinier.createElement(
      'div',
      // Style the text based on our tooltip_style object
      { style: tooltip_style }
    )
  )

  // Let's calculate the frequency of letters in the ID
  var letters = calculateLetterFrequency(args.state.biggId)

  // Set margins and size for the plot
  var margin = { top: 20, right: 20, bottom: 30, left: 40 }
  var width = 200 - margin.left - margin.right
  var height = 200 - margin.top - margin.bottom

  // Create D3 scales
  var x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1, 0.2)
  var y = d3.scale.linear().range([height, 0])

  // Create a SVG element for the plot
  var svg = d3.select(args.el).select('div').append('svg')
         .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  // Create x and y domains
  x.domain(letters.map(function (d) { return d.letter }))
  var max_y = d3.max(letters, function (d) { return d.frequency })
  y.domain([ 0, max_y ])

  // Add the axes
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.svg.axis().scale(x).orient('bottom'))
  svg.append('g')
    .attr('class', 'y axis')
    .call(d3.svg.axis().scale(y).orient('left').ticks(max_y))

  // Add the bars
  svg.selectAll('.bar')
    .data(letters)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', function (d) { return x(d.letter) })
    .attr('width', x.rangeBand())
    .attr('y', function (d) { return y(d.frequency) })
    .attr('height', function (d) { return height - y(d.frequency) })
}


// --------------------------------------------------
// TOOLTIP 3: Component with Tinier rendering and state handling
// --------------------------------------------------

var tooltips_5 = tinier.createComponent({
  init: function () {
    return {
      biggId: '',
      name: '',
      loc: { x: 0, y: 0 },
      data: null,
      type: null,
      // custom data
      count: 0,
    }
  },

  reducers: {
    setContainerData: function (args) {
      return Object.assign({}, args.state, {
        biggId: args.biggId,
        name: args.name,
        loc: args.loc,
        data: args.data,
        type: args.type,
        count: args.state.count + 1,
      })
    },
  },

  render: function (args) {
    tinier.render(
      args.el,
      tinier.createElement(
        'div', { style: tooltip_style },
        'Hello tinier ' + args.state.biggId + ' ' + args.state.count
      )
    )
  }
})

// --------------------------------------------------
// Load the Escher map
// --------------------------------------------------

// Fun this code after the page loads
window.onload = function () {

  d3.json('e_coli.iJO1366.central_metabolism.json', function(e, data) {
    if (e) console.warn(e)
    var options = {
      menu: 'zoom',
      fill_screen: true,
      // --------------------------------------------------
      // CHANGE ME
      tooltip_component: tooltips_4,
      // --------------------------------------------------
    }
    var b = escher.Builder(data, null, null, d3.select('#map_container'),
                           options)
  })

}
