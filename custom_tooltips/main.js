const preact = escher.libs.preact;
const h = preact.createElement;
const Component = preact.Component;

var tooltipStyle = {
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
  'box-shadow': '4px 6px 20px 0px rgba(0, 0, 0, 0.4)'
};

//-------------------------------------
// TOOLTIP 1: Tooltip with random pics
//-------------------------------------

const Tooltip1 = props => {
  return (
    // Style the text based on our tooltip_style object
    h('div', { style: tooltipStyle},
      // Update the text to read out the identifier biggId
      'Hello tooltip world ' + props.biggId,
      // Line break
      h('br'),
      // Add a picture. Get a random pic from unsplash, with ID between 0 and 1000.
      h('img', { src: 'https://unsplash.it/100/100?image=' +  Math.floor(Math.random() * 1000) })
     )
  );
};

//-----------------------------------
// TOOLTIP 2: Tooltip with a D3 plot
//-----------------------------------

/**
 * Function to calculate the frequency of letters in a word.
 */
function calculateLetterFrequency (s) {
  var counts = {};
  s.toUpperCase().split('').map(function (c) {
    if (!(c in counts)) {
      counts[c] = 1;
    } else {
      counts[c] += 1;
    }
  });
  return Object.keys(counts).map(function (k) {
    return { letter: k, frequency: counts[k] };
  });
};

/**
 * Tooltip function that shows plots with the frequency of letters in each ID.
 */
class Tooltip2 extends Component {
  componentShouldUpdate() {
    return false;
  }

  componentWillReceiveProps(nextProps) {
    // Clear tooltip
    const base = d3.select(this.base);
    base.selectAll('*').remove();

    // Let's calculate the frequency of letters in the ID
    const letters = calculateLetterFrequency(nextProps.biggId);

    // Set margins and size for the plot
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 200 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Create D3 scales
    const x = d3.scaleBand().range([0, width]).paddingInner(0.1).paddingOuter(0.2)
    const y = d3.scaleLinear().range([height, 0])

    // Create a SVG element for the plot
    const svg = base.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // Create x and y domains
    x.domain(letters.map(function (d) { return d.letter }))
    const max_y = d3.max(letters, function (d) { return d.frequency })
    y.domain([ 0, max_y ])

    // Add the axes
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom().scale(x))
    svg.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft().scale(y).ticks(max_y))

    // Add the bars
    svg.selectAll('.bar')
      .data(letters)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', function (d) { return x(d.letter) })
      .attr('width', x.bandwidth())
      .attr('y', function (d) { return y(d.frequency) })
      .attr('height', function (d) { return height - y(d.frequency) })
  }

  render() {
    // Style the text based on our tooltip_style object
    return h('div', { style: tooltipStyle });
  }
}

//---------------------
// Load the Escher map
//---------------------

escher.libs.d3_json('iJO1366.Central metabolism.json', function (e, data) {
  if (e) console.warn(e)
  var options = {
    menu: 'zoom',
    fill_screen: true,
    never_ask_before_quit: true,
    // --------------------------------------------------
    // CHANGE ME
    tooltip_component: Tooltip2
    // --------------------------------------------------
  };
  escher.Builder(data, null, null, escher.libs.d3_select('#map_container'), options);
});
